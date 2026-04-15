import axios from 'axios';
import { Song } from '../types';

const BASE_URL = 'https://www.jiosaavn.com/api.php';
const SEARCH_FALLBACK_URL = 'https://jiosaavn-api-privatecvc2.vercel.app';
const SONG_DETAILS_URL = 'https://jiosavan-api2.vercel.app';
const UA = 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36';
const LANG_COOKIE = 'L=hindi,english,telugu,tamil,punjabi,kannada,malayalam,bengali,marathi,gujarati';

const HEADERS = { 'User-Agent': UA };

// Decode HTML entities from JioSaavn API responses
function decodeEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&apos;/g, "'");
}

// Curated playlist IDs per language
const TRENDING_PLAYLISTS: Record<string, string[]> = {
  hindi: ['1134543272', '110858205'],
  english: ['1134595537', '945969391'],
  telugu: ['1134643225', '951897805'],
  tamil: ['1134651042', '1026391929'],
  punjabi: ['1134543511', '946945296'],
  kannada: ['1134591169', '948035636'],
  malayalam: ['1134705865', '951898142'],
  bengali: ['1134638573', '1064016932'],
  marathi: ['1134710071', '951898019'],
  gujarati: ['1134743773'],
};

// In-memory trending cache for search fallback
let trendingCache: Song[] = [];
let trendingCacheTime = 0;
const TRENDING_CACHE_TTL = 30 * 60 * 1000; // 30 min

function getStreamUrl(previewUrl: string): string {
  if (!previewUrl) return '';
  return previewUrl
    .replace('preview.saavncdn.com', 'aac.saavncdn.com')
    .replace('_96_p.mp4', '_320.mp4');
}

function getHighResImage(imageUrl: string): string {
  if (!imageUrl) return '';
  return imageUrl.replace('150x150', '500x500').replace('50x50', '500x500');
}

function mapDirectSong(raw: any): Song | null {
  if (!raw || !raw.id) return null;
  const streamUrl = getStreamUrl(raw.media_preview_url || '');
  const art = getHighResImage(raw.image || '');
  return {
    id: `jiosaavn-${raw.id}`,
    source: 'jiosaavn',
    sourceId: raw.id,
    title: decodeEntities(raw.song || raw.title || ''),
    artist: decodeEntities(raw.primary_artists || raw.singers || 'Unknown'),
    album: decodeEntities(raw.album || ''),
    artwork: art,
    image: art,
    duration: parseInt(raw.duration, 10) || 0,
    streamUrl,
    downloadUrl: streamUrl,
    quality: '320kbps',
    language: raw.language || undefined,
    year: raw.year ? parseInt(raw.year, 10) : undefined,
  };
}

async function callApi(params: Record<string, string>, extraHeaders?: Record<string, string>): Promise<any> {
  const response = await axios.get(BASE_URL, {
    params: { ...params, _format: 'json', _marker: '0' },
    headers: { ...HEADERS, ...extraHeaders },
    timeout: 15000,
  });
  // JioSaavn sometimes returns HTML or prefixed JSON — strip any prefix
  let data = response.data;
  if (typeof data === 'string') {
    // Remove potential JSONP/HTML prefix
    const jsonStart = data.indexOf('{');
    const jsonArrayStart = data.indexOf('[');
    const start = jsonStart >= 0 && (jsonArrayStart < 0 || jsonStart < jsonArrayStart) ? jsonStart : jsonArrayStart;
    if (start > 0) data = data.slice(start);
    try { data = JSON.parse(data); } catch { /* return as-is */ }
  }
  return data;
}

export async function searchSongs(query: string, page: number = 1, limit: number = 30): Promise<Song[]> {
  // Try direct JioSaavn search first
  try {
    const data = await callApi({ __call: 'search.getResults', q: query, n: String(limit), p: String(page) });
    const results = data?.results || data?.data || [];
    if (Array.isArray(results) && results.length > 0) {
      const songs = results.map(mapDirectSong).filter(Boolean) as Song[];
      if (songs.length > 0) return songs;
    }
  } catch (err) {
    console.warn('[JIOSAAVN] Direct search failed:', (err as Error).message);
  }

  // Try fallback API (only page 1 — fallback doesn't paginate well)
  if (page === 1) {
    try {
      const res = await axios.get(`${SEARCH_FALLBACK_URL}/search/songs`, {
        params: { query, limit: Math.min(limit, 30), page },
        timeout: 10000,
      });
      const fbData = res.data;
      if (fbData?.success && fbData?.data?.results) {
        return fbData.data.results.map((s: any) => {
          const dl = s.downloadUrl;
          const streamUrl = Array.isArray(dl) ? (dl.find((d: any) => d.quality === '320kbps')?.url || dl[dl.length - 1]?.url || '') : '';
          const img = Array.isArray(s.image) ? (s.image.find((i: any) => i.quality === '500x500')?.url || s.image[s.image.length - 1]?.url || '') : (s.image || '');
          return {
            id: `jiosaavn-${s.id}`,
            source: 'jiosaavn' as const,
            sourceId: s.id,
            title: decodeEntities(s.name || s.song || ''),
            artist: decodeEntities(s.artists?.primary?.map((a: any) => a.name).join(', ') || s.primaryArtists || 'Unknown'),
            album: decodeEntities(s.album?.name || ''),
            artwork: img,
            image: img,
            duration: s.duration || 0,
            streamUrl,
            downloadUrl: streamUrl,
            quality: '320kbps',
            language: s.language || undefined,
            year: s.year ? parseInt(s.year, 10) : undefined,
          };
        });
      }
    } catch (err) {
      console.warn('[JIOSAAVN] Fallback search failed:', (err as Error).message);
    }
  }

  // Last resort: filter cached trending data (page 1 only)
  if (page === 1) {
    const trending = await getCachedTrending();
    const q = query.toLowerCase();
    return trending.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      (s.album && s.album.toLowerCase().includes(q))
    );
  }

  return [];
}

export async function searchAlbums(query: string): Promise<Array<{ id: string; title: string; artist: string; image: string; year?: string; songCount?: number }>> {
  try {
    const data = await callApi({ __call: 'search.getAlbumResults', q: query, n: '10', p: '1' });
    const results = data?.results || data?.data || [];
    if (!Array.isArray(results)) return [];
    return results.map((a: any) => ({
      id: a.albumid || a.id || '',
      title: decodeEntities(a.title || a.name || ''),
      artist: decodeEntities(a.music || a.artist || a.primary_artists || ''),
      image: getHighResImage(a.image || ''),
      year: a.year || undefined,
      songCount: a.song_count ? parseInt(a.song_count, 10) : undefined,
    })).filter((a: any) => a.id);
  } catch (err) {
    console.warn('[JIOSAAVN] searchAlbums failed:', (err as Error).message);
    return [];
  }
}

export async function searchArtists(query: string): Promise<Array<{ id: string; name: string; image: string; isVerified?: boolean }>> {
  try {
    const data = await callApi({ __call: 'search.getArtistResults', q: query, n: '10', p: '1' });
    const results = data?.results || data?.data || [];
    if (!Array.isArray(results)) return [];
    return results.map((a: any) => ({
      id: a.artistId || a.id || '',
      name: decodeEntities(a.name || a.title || ''),
      image: getHighResImage(a.image || ''),
      isVerified: a.isVerified || false,
    })).filter((a: any) => a.id);
  } catch (err) {
    console.warn('[JIOSAAVN] searchArtists failed:', (err as Error).message);
    return [];
  }
}

async function getCachedTrending(): Promise<Song[]> {
  if (trendingCache.length > 0 && Date.now() - trendingCacheTime < TRENDING_CACHE_TTL) {
    return trendingCache;
  }
  try {
    const songs = await getTrending('hindi,english,telugu,tamil,punjabi');
    trendingCache = songs;
    trendingCacheTime = Date.now();
    return songs;
  } catch {
    return trendingCache;
  }
}

export async function getSongDetails(id: string): Promise<Song | null> {
  // Use fallback API — it returns decrypted download URLs that actually work
  // The direct JioSaavn API returns encrypted/preview URLs that 404 on CDN
  try {
    const res = await axios.get(`${SONG_DETAILS_URL}/api/songs/${id}`, { timeout: 10000 });
    const fbData = res.data;
    if (fbData?.success !== false && fbData?.data) {
      const songs = Array.isArray(fbData.data) ? fbData.data : [fbData.data];
      const s = songs[0];
      if (s) {
        const dl = s.downloadUrl;
        const streamUrl = Array.isArray(dl)
          ? (dl.find((d: any) => d.quality === '320kbps')?.url ||
             dl.find((d: any) => d.quality === '160kbps')?.url ||
             dl.find((d: any) => d.quality === '96kbps')?.url ||
             dl[dl.length - 1]?.url || '')
          : '';
        const img = Array.isArray(s.image)
          ? (s.image.find((i: any) => i.quality === '500x500')?.url || s.image[s.image.length - 1]?.url || '')
          : (s.image || '');

        return {
          id: `jiosaavn-${s.id}`,
          source: 'jiosaavn',
          sourceId: s.id,
          title: decodeEntities(s.name || s.song || ''),
          artist: decodeEntities(s.artists?.primary?.map((a: any) => a.name).join(', ') || s.primaryArtists || 'Unknown'),
          album: decodeEntities(s.album?.name || s.album || ''),
          artwork: img,
          image: img,
          duration: s.duration || 0,
          streamUrl,
          downloadUrl: streamUrl,
          quality: '320kbps',
          language: s.language || undefined,
          year: s.year ? parseInt(s.year, 10) : undefined,
        };
      }
    }
  } catch (err) {
    console.warn('[JIOSAAVN] Fallback getSongDetails failed:', (err as Error).message);
  }

  // Last resort: try direct API (may return broken preview URLs but better than nothing)
  try {
    const data = await callApi({ __call: 'song.getDetails', pids: id });
    const songData = data?.songs?.[0] || data?.[id] || Object.values(data || {})[0];
    if (songData && typeof songData === 'object' && songData.id) {
      return mapDirectSong(songData);
    }
  } catch (err) {
    console.warn('[JIOSAAVN] Direct getSongDetails failed:', (err as Error).message);
  }
  return null;
}

export async function getTrending(languages: string = 'hindi'): Promise<Song[]> {
  const langs = languages.split(',').map(l => l.trim().toLowerCase());
  const songs: Song[] = [];
  const seenIds = new Set<string>();

  for (const lang of langs) {
    const playlistIds = TRENDING_PLAYLISTS[lang] || TRENDING_PLAYLISTS['hindi'];
    for (const pid of playlistIds) {
      try {
        const data = await callApi({ __call: 'playlist.getDetails', listid: pid, n: '50' });
        const songList = data?.songs || [];
        for (const raw of songList) {
          if (!seenIds.has(raw.id) && raw.media_preview_url) {
            seenIds.add(raw.id);
            const mapped = mapDirectSong(raw);
            if (mapped) songs.push(mapped);
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
  try {
    const data = await callApi({ __call: 'content.getAlbumDetails', albumid: id });
    if (!data) return null;
    const songList = (data.songs || []).map(mapDirectSong).filter(Boolean) as Song[];
    return {
      album: {
        id: data.albumid || data.id || id,
        name: data.title || data.name || '',
        year: data.year || '',
        songCount: songList.length,
        artwork: getHighResImage(data.image || ''),
        artists: data.primary_artists || '',
      },
      songs: songList,
    };
  } catch (err) {
    console.warn('[JIOSAAVN] getAlbum failed:', (err as Error).message);
    return null;
  }
}

export async function getArtist(id: string): Promise<Record<string, unknown> | null> {
  try {
    const data = await callApi({ __call: 'content.getArtistDetails', artistId: id });
    if (!data) return null;
    const topSongs = (data.topSongs || data.songs || []).map(mapDirectSong).filter(Boolean) as Song[];
    return {
      id: data.artistId || id,
      name: data.name || '',
      image: getHighResImage(data.image || ''),
      followerCount: data.follower_count || 0,
      isVerified: data.isVerified || false,
      topSongs,
      topAlbums: (data.topAlbums || []).map((a: any) => ({
        id: a.albumid || a.id,
        name: a.title || a.name || '',
        year: a.year || '',
        artwork: getHighResImage(a.image || ''),
      })),
    };
  } catch (err) {
    console.warn('[JIOSAAVN] getArtist failed:', (err as Error).message);
    return null;
  }
}

export async function getPlaylist(id: string): Promise<{ playlist: Record<string, unknown>; songs: Song[] } | null> {
  try {
    const data = await callApi({ __call: 'playlist.getDetails', listid: id, n: '50' });
    if (!data) return null;
    const songList = (data.songs || []).map(mapDirectSong).filter(Boolean) as Song[];
    return {
      playlist: {
        id: data.listid || id,
        name: data.listname || data.title || '',
        songCount: songList.length,
        followerCount: data.follower_count || 0,
        artwork: getHighResImage(data.image || ''),
      },
      songs: songList,
    };
  } catch (err) {
    console.warn('[JIOSAAVN] getPlaylist failed:', (err as Error).message);
    return null;
  }
}

// Genre/mood support — fetch songs using curated playlists + targeted search
// Each mood/genre has UNIQUE playlist IDs — never share the same playlist across categories

export const GENRE_PLAYLISTS: Record<string, string[]> = {
  // Genres — unique curated playlists per genre
  bollywood: ['1080335349', '1265126272'],     // Hindi Hit Songs, Chartbusters 2025
  pop: ['1265127670', '156473621'],             // Pop Hits 2025, Asli Pop
  hiphop: [],                                    // search-based (no good curated playlist)
  classical: [],                                 // search-based
  lofi: [],                                      // search-based
  indie: ['107605145'],                          // Best Of Indie - Hindi
  edm: ['1265128038', '932189657'],             // Dance Hits 2025, Best Of Dance
  rock: [],                                      // search-based
  devotional: [],                                // search-based
  ghazal: ['77076833'],                          // Best Of Ghazals - Hindi
  sufi: [],                                      // search-based
  punjabi: ['1134543511'],

  // Moods — each mood has its OWN distinct playlists, no sharing
  chill: ['158223987'],                          // Chill Maaro
  workout: ['111163065'],                        // Workout - 1 Hour
  romance: ['903166403', '1265126631'],          // Best Of Romance, Romantic Hits 2025
  party: ['5148894', '932189657'],               // Nach Le, Best Of Dance
  sad: ['149267518'],                            // Indipop Sad Songs
  focus: [],                                     // search-based (study/focus)
  'road-trip': ['6689255'],                      // Taaza Tunes
  roadtrip: ['6689255'],                         // Taaza Tunes
  rain: [],                                      // search-based (monsoon/rain)
  happy: ['1265126272', '49'],                   // Chartbusters 2025, Dumdaar Hits
};

// Targeted search queries per mood/genre — used when playlists return too few results
const GENRE_SEARCH_QUERIES: Record<string, string[]> = {
  chill: ['chill hindi songs', 'relaxing bollywood'],
  workout: ['gym workout hindi', 'high energy pump songs'],
  romance: ['romantic hindi songs 2025', 'love songs bollywood'],
  party: ['party songs hindi 2025', 'dance hits bollywood'],
  sad: ['sad hindi songs', 'heartbreak bollywood songs'],
  focus: ['instrumental focus music', 'study music indian'],
  devotional: ['morning bhajan', 'aarti devotional hindi'],
  'road-trip': ['road trip hindi songs', 'driving songs bollywood'],
  roadtrip: ['road trip hindi songs', 'driving songs bollywood'],
  rain: ['baarish hindi songs', 'monsoon romantic bollywood'],
  happy: ['feel good hindi songs', 'upbeat bollywood 2025'],
  bollywood: ['bollywood hits 2025', 'new hindi songs'],
  pop: ['hindi pop songs', 'pop hits india'],
  hiphop: ['hindi rap songs', 'desi hip hop'],
  classical: ['indian classical music', 'raag hindustani'],
  lofi: ['lofi hindi songs', 'bollywood lofi remix'],
  indie: ['indie hindi music', 'indian indie songs'],
  edm: ['edm hindi remix', 'electronic dance bollywood'],
  rock: ['hindi rock songs', 'rock music india'],
  ghazal: ['best ghazals hindi', 'jagjit singh ghazal'],
  sufi: ['sufi songs hindi', 'sufi music bollywood'],
  punjabi: ['punjabi hits 2025', 'new punjabi songs'],
};

export async function getGenreSongs(slug: string): Promise<Song[]> {
  const playlistIds = GENRE_PLAYLISTS[slug];
  const songs: Song[] = [];
  const seenIds = new Set<string>();

  // Phase 1: Fetch from curated playlists
  if (playlistIds && playlistIds.length > 0) {
    for (const pid of playlistIds) {
      try {
        const data = await callApi({ __call: 'playlist.getDetails', listid: pid, n: '50' });
        for (const raw of (data?.songs || [])) {
          if (!seenIds.has(raw.id) && raw.media_preview_url) {
            seenIds.add(raw.id);
            const mapped = mapDirectSong(raw);
            if (mapped) songs.push(mapped);
          }
        }
      } catch (err) {
        console.warn(`[JIOSAAVN] Genre playlist ${pid} failed:`, (err as Error).message);
      }
    }
  }

  // Phase 2: If not enough songs, use targeted search queries
  if (songs.length < 10) {
    const queries = GENRE_SEARCH_QUERIES[slug] || [slug];
    for (const query of queries) {
      if (songs.length >= 30) break;
      try {
        const searched = await searchSongs(query, 1, 20);
        for (const s of searched) {
          if (!seenIds.has(s.sourceId || s.id)) {
            seenIds.add(s.sourceId || s.id);
            songs.push(s);
          }
        }
      } catch (err) {
        console.warn(`[JIOSAAVN] Genre search "${query}" failed:`, (err as Error).message);
      }
    }
  }

  // Phase 3: Last resort — generic search on slug name
  if (songs.length === 0) {
    const searched = await searchSongs(slug);
    if (searched.length > 0) return searched;
    return getTrending('hindi');
  }

  return songs;
}
