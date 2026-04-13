import axios from 'axios';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';

let accessToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Spotify credentials not configured');

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await axios.post(TOKEN_URL, 'grant_type=client_credentials', {
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    timeout: 10000,
  });

  accessToken = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000; // refresh 1 min early
  return accessToken!;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string;
  previewUrl: string | null;
  durationMs: number;
  popularity: number;
  releaseDate: string;
  spotifyUrl: string;
}

export async function searchTrack(query: string): Promise<SpotifyTrack | null> {
  try {
    const token = await getToken();
    const res = await axios.get(`${API_BASE}/search`, {
      params: { q: query, type: 'track', limit: 1, market: 'IN' },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    const track = res.data?.tracks?.items?.[0];
    if (!track) return null;

    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map((a: any) => a.name).join(', '),
      album: track.album?.name || '',
      albumArt: track.album?.images?.[0]?.url || '',
      previewUrl: track.preview_url || null,
      durationMs: track.duration_ms || 0,
      popularity: track.popularity || 0,
      releaseDate: track.album?.release_date || '',
      spotifyUrl: track.external_urls?.spotify || '',
    };
  } catch (err) {
    console.warn('[SPOTIFY] searchTrack failed:', (err as Error).message);
    return null;
  }
}

export async function getArtistArt(artistName: string): Promise<string | null> {
  try {
    const token = await getToken();
    const res = await axios.get(`${API_BASE}/search`, {
      params: { q: artistName, type: 'artist', limit: 1 },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    return res.data?.artists?.items?.[0]?.images?.[0]?.url || null;
  } catch {
    return null;
  }
}
