import axios from 'axios';
import { Song } from '../types';

const BASE_URL = process.env.JIOSAAVN_API_URL || 'https://jiosavan-api2.vercel.app/api';

interface SaavnImage {
  quality: string;
  url: string;
}

interface SaavnDownloadUrl {
  quality: string;
  url: string;
}

interface SaavnArtist {
  id: string;
  name: string;
  url: string;
  image?: SaavnImage[];
}

interface SaavnSong {
  id: string;
  name: string;
  duration: number;
  language: string;
  year: string;
  album: {
    id: string;
    name: string;
    url: string;
  };
  artists: {
    primary: SaavnArtist[];
    featured: SaavnArtist[];
    all: SaavnArtist[];
  };
  image: SaavnImage[];
  downloadUrl: SaavnDownloadUrl[];
}

interface SaavnSearchResponse {
  success: boolean;
  data: {
    total: number;
    start: number;
    results: SaavnSong[];
  };
}

interface SaavnSongDetailResponse {
  success: boolean;
  data: SaavnSong[];
}

interface SaavnAlbumResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    year: string;
    songCount: number;
    image: SaavnImage[];
    artists: { primary: SaavnArtist[] };
    songs: SaavnSong[];
  };
}

interface SaavnArtistResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    image: SaavnImage[];
    followerCount: number;
    fanCount: string;
    isVerified: boolean;
    topSongs: SaavnSong[];
    topAlbums: Array<{
      id: string;
      name: string;
      year: string;
      image: SaavnImage[];
    }>;
  };
}

interface SaavnPlaylistResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    songCount: number;
    followerCount: number;
    image: SaavnImage[];
    songs: SaavnSong[];
  };
}

// Curated JioSaavn playlist IDs for trending content
const TRENDING_PLAYLISTS: Record<string, string[]> = {
  hindi: ['110858205', '1134543272'],     // Trending Today, Hindi Top 50
  english: ['159144718', '93541550'],      // Feel Good Pop, English Top 40
  telugu: ['1134647498'],                  // Telugu Top 50
  tamil: ['1134605498'],                   // Tamil Top 50
  punjabi: ['1134718498'],                 // Punjabi Top 50
};

function getHighestQualityImage(images: SaavnImage[]): string {
  if (!images || images.length === 0) return '';
  // Prefer 500x500 or last (highest)
  const high = images.find(i => i.quality === '500x500');
  return high ? high.url : images[images.length - 1].url;
}

function getHighestQualityDownload(urls: SaavnDownloadUrl[]): { url: string; quality: string } {
  if (!urls || urls.length === 0) return { url: '', quality: 'unknown' };
  // Prefer 320kbps, then highest
  const high = urls.find(u => u.quality === '320kbps');
  if (high) return { url: high.url, quality: high.quality };
  const last = urls[urls.length - 1];
  return { url: last.url, quality: last.quality };
}

function mapSaavnSong(song: SaavnSong): Song {
  const download = getHighestQualityDownload(song.downloadUrl);
  const primaryArtists = song.artists?.primary?.map(a => a.name).join(', ') || 'Unknown';

  return {
    id: `jiosaavn-${song.id}`,
    source: 'jiosaavn',
    sourceId: song.id,
    title: song.name,
    artist: primaryArtists,
    album: song.album?.name || '',
    artwork: getHighestQualityImage(song.image),
    duration: song.duration || 0,
    streamUrl: download.url,
    downloadUrl: download.url,
    quality: download.quality,
    language: song.language || undefined,
    year: song.year ? parseInt(song.year, 10) : undefined,
  };
}

export async function searchSongs(query: string): Promise<Song[]> {
  const response = await axios.get<SaavnSearchResponse>(`${BASE_URL}/search/songs`, {
    params: { query },
    timeout: 10000,
  });

  if (!response.data.success || !response.data.data?.results) {
    return [];
  }

  return response.data.data.results.map(mapSaavnSong);
}

export async function getSongDetails(id: string): Promise<Song | null> {
  const response = await axios.get<SaavnSongDetailResponse>(`${BASE_URL}/songs/${id}`, {
    timeout: 10000,
  });

  if (!response.data.success || !response.data.data?.[0]) {
    return null;
  }

  return mapSaavnSong(response.data.data[0]);
}

export async function getTrending(languages: string = 'hindi'): Promise<Song[]> {
  const langs = languages.split(',').map(l => l.trim().toLowerCase());
  const songs: Song[] = [];
  const seenIds = new Set<string>();

  for (const lang of langs) {
    const playlistIds = TRENDING_PLAYLISTS[lang] || TRENDING_PLAYLISTS['hindi'];
    for (const pid of playlistIds) {
      try {
        const response = await axios.get<SaavnPlaylistResponse>(`${BASE_URL}/playlists`, {
          params: { id: pid },
          timeout: 10000,
        });

        if (response.data.success && response.data.data?.songs) {
          for (const song of response.data.data.songs) {
            if (!seenIds.has(song.id) && song.downloadUrl) {
              seenIds.add(song.id);
              songs.push(mapSaavnSong(song));
            }
          }
        }
      } catch (err) {
        console.warn(`[JIOSAAVN] Failed to fetch playlist ${pid}:`, (err as Error).message);
      }
    }
  }

  return songs;
}

export async function getAlbum(id: string): Promise<{ album: Record<string, unknown>; songs: Song[] } | null> {
  const response = await axios.get<SaavnAlbumResponse>(`${BASE_URL}/albums`, {
    params: { id },
    timeout: 10000,
  });

  if (!response.data.success || !response.data.data) {
    return null;
  }

  const data = response.data.data;
  return {
    album: {
      id: data.id,
      name: data.name,
      year: data.year,
      songCount: data.songCount,
      artwork: getHighestQualityImage(data.image),
      artists: data.artists?.primary?.map(a => a.name).join(', ') || '',
    },
    songs: data.songs?.map(mapSaavnSong) || [],
  };
}

export async function getArtist(id: string): Promise<Record<string, unknown> | null> {
  const response = await axios.get<SaavnArtistResponse>(`${BASE_URL}/artists/${id}`, {
    timeout: 10000,
  });

  if (!response.data.success || !response.data.data) {
    return null;
  }

  const data = response.data.data;
  return {
    id: data.id,
    name: data.name,
    image: getHighestQualityImage(data.image),
    followerCount: data.followerCount,
    isVerified: data.isVerified,
    topSongs: data.topSongs?.map(mapSaavnSong) || [],
    topAlbums: data.topAlbums?.map(a => ({
      id: a.id,
      name: a.name,
      year: a.year,
      artwork: getHighestQualityImage(a.image),
    })) || [],
  };
}

export async function getPlaylist(id: string): Promise<{ playlist: Record<string, unknown>; songs: Song[] } | null> {
  const response = await axios.get(`${BASE_URL}/playlists`, {
    params: { id },
    timeout: 10000,
  });

  if (!response.data.success || !response.data.data) {
    return null;
  }

  const data = response.data.data;
  return {
    playlist: {
      id: data.id,
      name: data.name,
      songCount: data.songCount,
      followerCount: data.followerCount,
      artwork: getHighestQualityImage(data.image || []),
    },
    songs: data.songs?.map(mapSaavnSong) || [],
  };
}
