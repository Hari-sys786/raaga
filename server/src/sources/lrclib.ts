import axios from 'axios';
import { LyricsResult } from '../types';

const BASE_URL = 'https://lrclib.net/api';

interface LrcLibSearchResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

export async function searchLyrics(query: string): Promise<LyricsResult[]> {
  const response = await axios.get<LrcLibSearchResult[]>(`${BASE_URL}/search`, {
    params: { q: query },
    timeout: 10000,
    headers: {
      'User-Agent': 'Raaga Music Player v1.0.0',
    },
  });

  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data.map(item => ({
    id: item.id,
    trackName: item.trackName,
    artistName: item.artistName,
    albumName: item.albumName,
    duration: item.duration,
    plainLyrics: item.plainLyrics,
    syncedLyrics: item.syncedLyrics,
  }));
}

export async function getLyrics(artistName: string, trackName: string): Promise<LyricsResult | null> {
  const response = await axios.get<LrcLibSearchResult>(`${BASE_URL}/get`, {
    params: {
      artist_name: artistName,
      track_name: trackName,
    },
    timeout: 10000,
    headers: {
      'User-Agent': 'Raaga Music Player v1.0.0',
    },
  });

  if (!response.data) {
    return null;
  }

  return {
    id: response.data.id,
    trackName: response.data.trackName,
    artistName: response.data.artistName,
    albumName: response.data.albumName,
    duration: response.data.duration,
    plainLyrics: response.data.plainLyrics,
    syncedLyrics: response.data.syncedLyrics,
  };
}
