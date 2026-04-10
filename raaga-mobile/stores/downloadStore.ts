import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song } from '../types';

export interface DownloadedSong {
  song: Song;
  localPath: string;
  localArtwork: string;
  downloadedAt: number;
  fileSize: number;
}

export interface DownloadQueueItem {
  song: Song;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

interface DownloadState {
  downloads: Record<string, DownloadedSong>;
  queue: DownloadQueueItem[];
  activeDownload: string | null;

  startDownload: (song: Song) => void;
  cancelDownload: (songId: string) => void;
  removeDownload: (songId: string) => void;
  updateProgress: (songId: string, progress: number) => void;
  markComplete: (songId: string, localPath: string, localArtwork: string, fileSize: number) => void;
  markFailed: (songId: string, error: string) => void;
  isDownloaded: (songId: string) => boolean;
  getDownloadedSong: (songId: string) => DownloadedSong | null;
  clearAll: () => void;
  setActiveDownload: (songId: string | null) => void;
  removeFromQueue: (songId: string) => void;
}

export const useDownloadStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {},
      queue: [],
      activeDownload: null,

      startDownload: (song: Song) => {
        const { downloads, queue } = get();
        // Already downloaded
        if (downloads[song.id]) return;
        // Already in queue
        if (queue.some((q) => q.song.id === song.id)) return;

        set({
          queue: [
            ...queue,
            { song, progress: 0, status: 'pending' },
          ],
        });
      },

      cancelDownload: (songId: string) => {
        set((state) => ({
          queue: state.queue.filter((q) => q.song.id !== songId),
          activeDownload: state.activeDownload === songId ? null : state.activeDownload,
        }));
      },

      removeDownload: (songId: string) => {
        set((state) => {
          const newDownloads = { ...state.downloads };
          delete newDownloads[songId];
          return { downloads: newDownloads };
        });
      },

      updateProgress: (songId: string, progress: number) => {
        set((state) => ({
          queue: state.queue.map((q) =>
            q.song.id === songId
              ? { ...q, progress, status: 'downloading' as const }
              : q
          ),
          activeDownload: songId,
        }));
      },

      markComplete: (songId: string, localPath: string, localArtwork: string, fileSize: number) => {
        const queueItem = get().queue.find((q) => q.song.id === songId);
        if (!queueItem) return;

        set((state) => ({
          downloads: {
            ...state.downloads,
            [songId]: {
              song: queueItem.song,
              localPath,
              localArtwork,
              downloadedAt: Date.now(),
              fileSize,
            },
          },
          queue: state.queue.filter((q) => q.song.id !== songId),
          activeDownload: state.activeDownload === songId ? null : state.activeDownload,
        }));
      },

      markFailed: (songId: string, error: string) => {
        set((state) => ({
          queue: state.queue.map((q) =>
            q.song.id === songId
              ? { ...q, status: 'failed' as const, error }
              : q
          ),
          activeDownload: state.activeDownload === songId ? null : state.activeDownload,
        }));
      },

      isDownloaded: (songId: string) => {
        return !!get().downloads[songId];
      },

      getDownloadedSong: (songId: string) => {
        return get().downloads[songId] ?? null;
      },

      clearAll: () => {
        set({ downloads: {}, queue: [], activeDownload: null });
      },

      setActiveDownload: (songId: string | null) => {
        set({ activeDownload: songId });
      },

      removeFromQueue: (songId: string) => {
        set((state) => ({
          queue: state.queue.filter((q) => q.song.id !== songId),
        }));
      },
    }),
    {
      name: 'raaga-downloads',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        downloads: state.downloads,
      }),
    }
  )
);
