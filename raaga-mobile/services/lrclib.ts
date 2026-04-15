// Direct lyrics client for React Native
// Ported from server/src/sources/lrclib.ts — uses fetch instead of axios

export interface LyricsResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

const BASE_URL = 'https://lrclib.net/api';
const UA = 'Raaga Music Player v1.0.0';

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

function mapResult(item: any): LyricsResult {
  return {
    id: item.id,
    trackName: item.trackName,
    artistName: item.artistName,
    albumName: item.albumName,
    duration: item.duration,
    plainLyrics: item.plainLyrics ?? null,
    syncedLyrics: item.syncedLyrics ?? null,
  };
}

export async function searchLyrics(query: string): Promise<LyricsResult[]> {
  try {
    const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } }, 10000);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(mapResult);
  } catch (err) {
    console.warn('[LRCLIB] searchLyrics failed:', (err as Error).message);
    return [];
  }
}

export async function getLyrics(
  artistName: string,
  trackName: string
): Promise<LyricsResult | null> {
  try {
    const url = `${BASE_URL}/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } }, 10000);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data) return null;
    return mapResult(data);
  } catch (err) {
    console.warn('[LRCLIB] getLyrics failed:', (err as Error).message);
    return null;
  }
}
