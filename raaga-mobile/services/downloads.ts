import {
  documentDirectory,
  makeDirectoryAsync,
  getInfoAsync,
  deleteAsync,
  downloadAsync,
  createDownloadResumable,
} from 'expo-file-system/legacy';
import { Song } from '../types';
import { api } from './api';
import { useDownloadStore } from '../stores/downloadStore';

const DOWNLOAD_DIR = (documentDirectory ?? '') + 'raaga-downloads/';
const ART_DIR = DOWNLOAD_DIR + 'art/';

let isProcessing = false;

async function ensureDirectories(): Promise<void> {
  const downloadInfo = await getInfoAsync(DOWNLOAD_DIR);
  if (!downloadInfo.exists) {
    await makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
  const artInfo = await getInfoAsync(ART_DIR);
  if (!artInfo.exists) {
    await makeDirectoryAsync(ART_DIR, { intermediates: true });
  }
}

export async function downloadSong(song: Song): Promise<void> {
  const store = useDownloadStore.getState();

  if (store.isDownloaded(song.id)) return;

  await ensureDirectories();

  const streamUrl = api.streamUrl(song.id, song.source || 'jiosaavn');
  const localPath = DOWNLOAD_DIR + song.id + '.mp3';
  const artPath = ART_DIR + song.id + '.jpg';

  store.updateProgress(song.id, 0);

  try {
    // Download audio
    const downloadResumable = createDownloadResumable(
      streamUrl,
      localPath,
      {},
      (downloadProgress) => {
        const progress =
          downloadProgress.totalBytesExpectedToWrite > 0
            ? downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite
            : 0;
        store.updateProgress(song.id, progress);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) {
      throw new Error('Download returned no result');
    }

    // Download artwork if available
    if (song.image) {
      try {
        await downloadAsync(song.image, artPath);
      } catch {
        // Artwork download failure is non-critical
      }
    }

    // Get file size
    const fileInfo = await getInfoAsync(localPath);
    const fileSize = fileInfo.exists && 'size' in fileInfo ? ((fileInfo as any).size ?? 0) : 0;

    store.markComplete(song.id, localPath, artPath, fileSize);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    store.markFailed(song.id, message);
    // Clean up partial download
    try {
      await deleteAsync(localPath, { idempotent: true });
    } catch {
      // ignore cleanup errors
    }
    throw error;
  }
}

export async function deleteSong(songId: string): Promise<void> {
  const store = useDownloadStore.getState();
  const downloaded = store.getDownloadedSong(songId);

  if (downloaded) {
    try {
      await deleteAsync(downloaded.localPath, { idempotent: true });
      await deleteAsync(downloaded.localArtwork, { idempotent: true });
    } catch {
      // ignore cleanup errors
    }
  }

  store.removeDownload(songId);
}

export async function deleteAllDownloads(): Promise<void> {
  const store = useDownloadStore.getState();

  try {
    await deleteAsync(DOWNLOAD_DIR, { idempotent: true });
  } catch {
    // ignore
  }

  store.clearAll();
}

export function getLocalPath(songId: string): string | null {
  const store = useDownloadStore.getState();
  const downloaded = store.getDownloadedSong(songId);
  return downloaded?.localPath ?? null;
}

export async function getStorageUsed(): Promise<number> {
  const store = useDownloadStore.getState();
  let total = 0;
  for (const key of Object.keys(store.downloads)) {
    total += store.downloads[key].fileSize;
  }
  return total;
}

/**
 * Prefetch the next song's stream URL so it loads faster when playback starts.
 * If the song is already downloaded locally, this is a no-op.
 */
export async function prefetchNextSong(song: Song): Promise<void> {
  // Already downloaded — will play from local, no prefetch needed
  if (getLocalPath(song.id)) return;

  try {
    const streamUrl = api.streamUrl(song.id, song.source || 'jiosaavn');
    // Fire a HEAD request to warm up the CDN/proxy connection
    await fetch(streamUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    console.log('[Prefetch] Warmed:', song.title);
  } catch {
    // Non-critical — just a performance optimization
  }
}

export function isDownloaded(songId: string): boolean {
  return useDownloadStore.getState().isDownloaded(songId);
}

export async function processDownloadQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const store = useDownloadStore.getState();
    const pending = store.queue.filter((q) => q.status === 'pending');

    for (const item of pending) {
      try {
        await downloadSong(item.song);
      } catch {
        // markFailed already called in downloadSong
      }
    }
  } finally {
    isProcessing = false;
  }
}
