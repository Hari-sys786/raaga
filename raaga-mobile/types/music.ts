export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  image?: string;
  source?: 'jiosaavn' | 'ytmusic';
  streamUrl?: string;
  language?: string;
  year?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  image?: string;
  songs?: Song[];
  year?: string;
  language?: string;
}

export interface Artist {
  id: string;
  name: string;
  image?: string;
  bio?: string;
  topSongs?: Song[];
  albums?: Album[];
}

export interface SearchResult {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  icon?: string;
}
