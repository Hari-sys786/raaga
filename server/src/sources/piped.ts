import axios from 'axios';
import { Song } from '../types';

// Multiple Piped instances for fallback
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.r4fo.com',
  'https://api.piped.yt',
];

function getBaseUrl(): string {
  return process.env.PIPED_API_URL || PIPED_INSTANCES[0];
}

const BASE_URL = getBaseUrl();

interface PipedSearchItem {
  url: string;
  title: string;
  thumbnail: string;
  uploaderName: string;
  uploaderUrl: string;
  duration: number;
  views: number;
  uploaded: number;
  uploadedDate: string;
}

interface PipedSearchResponse {
  items: PipedSearchItem[];
  nextpage: string;
}

interface PipedAudioStream {
  url: string;
  format: string;
  quality: string;
  mimeType: string;
  codec: string;
  bitrate: number;
  contentLength: number;
}

interface PipedStreamResponse {
  title: string;
  description: string;
  uploader: string;
  uploaderUrl: string;
  thumbnailUrl: string;
  duration: number;
  audioStreams: PipedAudioStream[];
}

function extractVideoId(url: string): string {
  // url is like /watch?v=VIDEO_ID
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : url.replace('/watch?v=', '');
}

function mapPipedToSong(item: PipedSearchItem): Song {
  const videoId = extractVideoId(item.url);
  return {
    id: `youtube-${videoId}`,
    source: 'youtube',
    sourceId: videoId,
    title: item.title,
    artist: item.uploaderName || 'Unknown',
    album: '',
    artwork: item.thumbnail || '' ,
    image: item.thumbnail || '',
    duration: item.duration || 0,
    quality: 'varies',
  };
}

export async function searchSongs(query: string): Promise<Song[]> {
  const response = await axios.get<PipedSearchResponse>(`${BASE_URL}/search`, {
    params: { q: query, filter: 'music_songs' },
    timeout: 10000,
  });

  if (!response.data.items) {
    return [];
  }

  return response.data.items
    .filter(item => item.url && item.duration > 0)
    .map(mapPipedToSong);
}

export async function getStreamUrl(videoId: string): Promise<{ url: string; quality: string } | null> {
  const response = await axios.get<PipedStreamResponse>(`${BASE_URL}/streams/${videoId}`, {
    timeout: 10000,
  });

  const streams = response.data.audioStreams;
  if (!streams || streams.length === 0) {
    return null;
  }

  // Pick highest bitrate audio stream
  const sorted = [...streams].sort((a, b) => b.bitrate - a.bitrate);
  const best = sorted[0];

  return {
    url: best.url,
    quality: best.quality || `${Math.round(best.bitrate / 1000)}kbps`,
  };
}

export async function getStreamDetails(videoId: string): Promise<Song | null> {
  const response = await axios.get<PipedStreamResponse>(`${BASE_URL}/streams/${videoId}`, {
    timeout: 10000,
  });

  const data = response.data;
  const streams = data.audioStreams;
  let streamUrl = '';
  let quality = 'unknown';

  if (streams && streams.length > 0) {
    const sorted = [...streams].sort((a, b) => b.bitrate - a.bitrate);
    streamUrl = sorted[0].url;
    quality = sorted[0].quality || `${Math.round(sorted[0].bitrate / 1000)}kbps`;
  }

  return {
    id: `youtube-${videoId}`,
    source: 'youtube',
    sourceId: videoId,
    title: data.title || '',
    artist: data.uploader || 'Unknown',
    album: '',
    artwork: data.thumbnailUrl || '' ,
    image: data.thumbnailUrl || '',
    duration: data.duration || 0,
    streamUrl,
    quality,
  };
}

export async function getTrending(): Promise<Song[]> {
  const response = await axios.get<PipedSearchItem[]>(`${BASE_URL}/trending`, {
    params: { region: 'IN' },
    timeout: 10000,
  });

  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data
    .filter(item => item.url && item.duration > 0 && item.duration < 600)
    .slice(0, 20)
    .map(mapPipedToSong);
}
