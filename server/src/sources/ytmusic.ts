import axios from 'axios';
import { Song } from '../types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const INNERTUBE_API = 'https://music.youtube.com/youtubei/v1';
const CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20250101.01.00',
    hl: 'en',
    gl: 'IN',
  },
};

interface YTMusicItem {
  videoId?: string;
  title?: string;
  artists?: Array<{ name: string }>;
  album?: { name: string };
  thumbnails?: Array<{ url: string; width: number; height: number }>;
  duration?: string;
  durationSeconds?: number;
}

function getBestThumbnail(thumbnails?: Array<{ url: string; width: number }>): string {
  if (!thumbnails || thumbnails.length === 0) return '';
  // Pick the largest thumbnail
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  return sorted[0].url;
}

function parseDuration(duration?: string): number {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function mapToSong(item: any): Song | null {
  const videoId = item.videoId;
  if (!videoId) return null;

  const title = item.title || '';
  const artists = item.artists?.map((a: any) => a.name).join(', ') || item.artist || 'Unknown';
  const album = item.album?.name || '';
  const thumbnail = getBestThumbnail(item.thumbnails);
  const duration = item.durationSeconds || parseDuration(item.duration);

  if (!title || duration <= 0) return null;

  return {
    id: `youtube-${videoId}`,
    source: 'youtube',
    sourceId: videoId,
    title,
    artist: artists,
    album,
    artwork: thumbnail,
    image: thumbnail,
    duration,
    quality: 'high',
  };
}

// Extract music items from YouTube Music search response
function extractSearchResults(data: any): Song[] {
  const songs: Song[] = [];
  try {
    const contents = data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]
      ?.tabRenderer?.content?.sectionListRenderer?.contents;

    if (!contents) return songs;

    for (const section of contents) {
      const items = section?.musicShelfRenderer?.contents ||
        section?.musicCardShelfRenderer?.contents || [];

      for (const item of items) {
        const renderer = item?.musicResponsiveListItemRenderer;
        if (!renderer) continue;

        const videoId = renderer?.playlistItemData?.videoId
          || renderer?.overlay?.musicItemThumbnailOverlayRenderer
            ?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
            ?.watchEndpoint?.videoId;
        if (!videoId) continue;

        // Extract title from flexColumns
        const flexColumns = renderer?.flexColumns || [];
        let title = '';
        let artist = '';
        let album = '';
        let duration = '';

        for (let i = 0; i < flexColumns.length; i++) {
          const runs = flexColumns[i]?.musicResponsiveListItemFlexColumnRenderer
            ?.text?.runs;
          if (!runs) continue;

          const text = runs.map((r: any) => r.text).join('');
          if (i === 0) title = text;
          else if (i === 1) {
            // Second column: "Artist1, Artist2 • Album • Duration" or "Artist • Duration"
            const parts = text.split(' \u2022 ');
            if (parts.length >= 3) {
              artist = parts[0] || '';
              album = parts[1] || '';
              duration = parts[parts.length - 1] || '';
            } else if (parts.length === 2) {
              artist = parts[0] || '';
              duration = parts[1] || '';
            } else {
              artist = parts[0] || '';
            }
          }
        }

        const thumbnails = renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;

        const song = mapToSong({
          videoId,
          title,
          artists: artist ? [{ name: artist }] : undefined,
          album: album ? { name: album } : undefined,
          thumbnails,
          duration,
          durationSeconds: parseDuration(duration),
        });

        if (song) songs.push(song);
      }
    }
  } catch (err) {
    console.warn('[YTMUSIC] Parse error:', (err as Error).message);
  }
  return songs;
}

export async function searchSongs(query: string, limit = 20): Promise<Song[]> {
  try {
    const response = await axios.post(
      `${INNERTUBE_API}/search?prettyPrint=false`,
      {
        context: CONTEXT,
        query,
        params: 'EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D', // filter: songs
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const songs = extractSearchResults(response.data);
    return songs.slice(0, limit);
  } catch (err) {
    console.warn('[YTMUSIC] Search failed:', (err as Error).message);
    return [];
  }
}

export async function getTrending(limit = 20): Promise<Song[]> {
  try {
    // YouTube Music charts API is hard to parse — use search for trending songs instead
    const queries = ['trending hindi songs 2025', 'new bollywood songs this week'];
    const songs: Song[] = [];
    const seenIds = new Set<string>();

    for (const query of queries) {
      if (songs.length >= limit) break;
      const results = await searchSongs(query, limit);
      for (const song of results) {
        if (!seenIds.has(song.sourceId) && songs.length < limit) {
          seenIds.add(song.sourceId);
          songs.push(song);
        }
      }
    }

    return songs;
  } catch (err) {
    console.warn('[YTMUSIC] Trending failed:', (err as Error).message);
    return [];
  }
}

// Get audio stream URL using yt-dlp (reliable fallback)
export async function getStreamUrl(videoId: string): Promise<{ url: string; quality: string } | null> {
  try {
    const { stdout } = await execAsync(
      `yt-dlp -f "bestaudio[ext=m4a]/bestaudio" --get-url "https://music.youtube.com/watch?v=${videoId}"`,
      { timeout: 15000 }
    );
    const url = stdout.trim();
    if (url) {
      return { url, quality: 'high' };
    }
    return null;
  } catch (err) {
    console.warn('[YTMUSIC] Stream URL failed for', videoId, ':', (err as Error).message);
    return null;
  }
}
