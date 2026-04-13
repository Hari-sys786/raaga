import axios from 'axios';

const API_BASE = 'https://musicbrainz.org/ws/2';
const UA = 'Raaga/1.0 (raaga-music-player)';

export interface MBRelease {
  id: string;
  title: string;
  artist: string;
  date: string;
  country: string;
  coverArtUrl: string | null;
}

export async function searchRelease(track: string, artist: string): Promise<MBRelease | null> {
  try {
    const query = `recording:"${track}" AND artist:"${artist}"`;
    const res = await axios.get(`${API_BASE}/recording`, {
      params: { query, fmt: 'json', limit: 1 },
      headers: { 'User-Agent': UA },
      timeout: 12000,
    });

    const recording = res.data?.recordings?.[0];
    if (!recording) return null;

    const release = recording.releases?.[0];
    if (!release) return null;

    // Try Cover Art Archive
    let coverArtUrl: string | null = null;
    try {
      const caRes = await axios.get(`https://coverartarchive.org/release/${release.id}`, {
        timeout: 8000,
        headers: { 'User-Agent': UA },
      });
      const front = caRes.data?.images?.find((img: any) => img.front);
      coverArtUrl = front?.thumbnails?.large || front?.thumbnails?.small || front?.image || null;
    } catch {
      // No cover art available
    }

    return {
      id: release.id,
      title: release.title || '',
      artist: recording['artist-credit']?.[0]?.name || artist,
      date: release.date || '',
      country: release.country || '',
      coverArtUrl,
    };
  } catch (err) {
    console.warn('[MUSICBRAINZ] searchRelease failed:', (err as Error).message);
    return null;
  }
}
