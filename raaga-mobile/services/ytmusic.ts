// Direct YouTube Music client for React Native
// Ported from server/src/sources/ytmusic.ts — uses fetch instead of axios
// NOTE: getStreamUrl is intentionally excluded (requires yt-dlp, server-side only)

export interface Song {
  id: string;
  source: 'jiosaavn' | 'youtube';
  sourceId: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  image: string;
  duration: number;
  streamUrl?: string;
  downloadUrl?: string;
  quality: string;
  language?: string;
  year?: number;
}

const INNERTUBE_API = 'https://music.youtube.com/youtubei/v1';
const CONTEXT = {
  client: {
    clientName: 'WEB_REMIX',
    clientVersion: '1.20250101.01.00',
    hl: 'en',
    gl: 'IN',
  },
};

function getBestThumbnail(thumbnails?: Array<{ url: string; width?: number }>): string {
  if (!thumbnails || thumbnails.length === 0) return '';
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
  const artists =
    item.artists?.map((a: any) => a.name).join(', ') || item.artist || 'Unknown';
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

function extractSearchResults(data: any): Song[] {
  const songs: Song[] = [];
  try {
    const contents =
      data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content
        ?.sectionListRenderer?.contents;

    if (!contents) return songs;

    for (const section of contents) {
      const items =
        section?.musicShelfRenderer?.contents ||
        section?.musicCardShelfRenderer?.contents ||
        [];

      for (const item of items) {
        const renderer = item?.musicResponsiveListItemRenderer;
        if (!renderer) continue;

        const videoId =
          renderer?.playlistItemData?.videoId ||
          renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content
            ?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
        if (!videoId) continue;

        const flexColumns = renderer?.flexColumns || [];
        let title = '';
        let artist = '';
        let album = '';
        let duration = '';

        for (let i = 0; i < flexColumns.length; i++) {
          const runs =
            flexColumns[i]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs;
          if (!runs) continue;

          const text = runs.map((r: any) => r.text).join('');
          if (i === 0) {
            title = text;
          } else if (i === 1) {
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

        const thumbnails =
          renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails;

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

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchSongs(query: string, limit = 20): Promise<Song[]> {
  try {
    const res = await fetchWithTimeout(
      `${INNERTUBE_API}/search?prettyPrint=false`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: CONTEXT,
          query,
          params: 'EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D', // filter: songs
        }),
      },
      10000
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const songs = extractSearchResults(data);
    return songs.slice(0, limit);
  } catch (err) {
    console.warn('[YTMUSIC] Search failed:', (err as Error).message);
    return [];
  }
}

export async function getTrending(limit = 20): Promise<Song[]> {
  try {
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
