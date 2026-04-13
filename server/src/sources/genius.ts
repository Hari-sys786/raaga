import axios from 'axios';

const API_BASE = 'https://api.genius.com';

function getToken(): string {
  const token = process.env.GENIUS_ACCESS_TOKEN;
  if (!token) throw new Error('Genius access token not configured');
  return token;
}

export interface GeniusLyrics {
  title: string;
  artist: string;
  url: string;
  thumbnailUrl: string;
  lyrics: string | null; // plain text lyrics from scraping
}

export async function searchSong(query: string): Promise<GeniusLyrics | null> {
  try {
    const token = getToken();
    const res = await axios.get(`${API_BASE}/search`, {
      params: { q: query },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });

    const hit = res.data?.response?.hits?.[0]?.result;
    if (!hit) return null;

    const lyricsUrl = hit.url;
    let lyrics: string | null = null;

    // Try to scrape lyrics from Genius page
    try {
      lyrics = await scrapeLyrics(lyricsUrl);
    } catch {
      // Lyrics scraping failed — still return metadata
    }

    return {
      title: hit.title || '',
      artist: hit.primary_artist?.name || '',
      url: lyricsUrl,
      thumbnailUrl: hit.song_art_image_thumbnail_url || hit.header_image_thumbnail_url || '',
      lyrics,
    };
  } catch (err) {
    console.warn('[GENIUS] searchSong failed:', (err as Error).message);
    return null;
  }
}

async function scrapeLyrics(url: string): Promise<string | null> {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Raaga/1.0)' },
      timeout: 15000,
    });
    const html = res.data as string;

    // Extract lyrics from Genius HTML — they use data-lyrics-container divs
    const containers: string[] = [];
    const regex = /data-lyrics-container="true"[^>]*>([\s\S]*?)(?=<\/div>)/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      containers.push(match[1]);
    }

    if (containers.length === 0) return null;

    // Strip HTML tags, decode entities
    const raw = containers.join('\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
      .trim();

    return raw || null;
  } catch {
    return null;
  }
}
