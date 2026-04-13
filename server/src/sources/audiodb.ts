import axios from 'axios';

const API_BASE = 'https://theaudiodb.com/api/v1/json/2'; // free tier key = 2

export interface AudioDBArt {
  albumArt: string | null;
  artistArt: string | null;
  artistThumb: string | null;
  artistBanner: string | null;
  cdArt: string | null;
}

export async function getAlbumArt(artist: string, album: string): Promise<string | null> {
  try {
    const res = await axios.get(`${API_BASE}/searchalbum.php`, {
      params: { s: artist, a: album },
      timeout: 10000,
    });
    const a = res.data?.album?.[0];
    return a?.strAlbumThumb || a?.strAlbumThumbHQ || a?.strAlbumCDart || null;
  } catch (err) {
    console.warn('[AUDIODB] getAlbumArt failed:', (err as Error).message);
    return null;
  }
}

export async function getArtistArt(artist: string): Promise<AudioDBArt | null> {
  try {
    const res = await axios.get(`${API_BASE}/search.php`, {
      params: { s: artist },
      timeout: 10000,
    });
    const a = res.data?.artists?.[0];
    if (!a) return null;

    return {
      albumArt: null,
      artistArt: a.strArtistFanart || a.strArtistFanart2 || a.strArtistFanart3 || null,
      artistThumb: a.strArtistThumb || null,
      artistBanner: a.strArtistBanner || null,
      cdArt: null,
    };
  } catch (err) {
    console.warn('[AUDIODB] getArtistArt failed:', (err as Error).message);
    return null;
  }
}
