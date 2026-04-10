export interface Song {
  id: string;
  source: 'jiosaavn' | 'youtube';
  sourceId: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: number;
  streamUrl?: string;
  downloadUrl?: string;
  quality: string;
  language?: string;
  year?: number;
}

export interface SearchResult {
  results: Song[];
  total: number;
  query: string;
}

export interface LyricsResult {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}
