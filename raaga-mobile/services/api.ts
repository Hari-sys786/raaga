// Raaga API — serverless mode
// All metadata calls go directly to JioSaavn/YouTube/lrclib APIs
// Only audio streaming still uses the server proxy

import { STREAM_BASE } from './config';
import { getCached, setCached } from './cache';
import * as jiosaavn from './jiosaavn';
import * as ytmusic from './ytmusic';
import * as lrclib from './lrclib';

// Cache TTLs
const TTL_TRENDING = 6 * 60 * 60 * 1000;   // 6 hours
const TTL_GENRE    = 3 * 60 * 60 * 1000;   // 3 hours
const TTL_SEARCH   = 5 * 60 * 1000;         // 5 minutes
const TTL_SONG     = 1 * 60 * 60 * 1000;   // 1 hour

export const api = {
  /** Search songs — combines JioSaavn + YouTube results */
  search: async (q: string, page = 1) => {
    const cacheKey = `search:${q}:${page}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const [jsResults, ytResults] = await Promise.allSettled([
      jiosaavn.searchSongs(q, page, 30),
      page === 1 ? ytmusic.searchSongs(q, 10) : Promise.resolve([]),
    ]);

    const jsSongs = jsResults.status === 'fulfilled' ? jsResults.value : [];
    const ytSongs = ytResults.status === 'fulfilled' ? ytResults.value : [];
    const songs = [...jsSongs, ...ytSongs];

    const result = {
      results: songs,
      total: songs.length,
      query: q,
      hasMore: jsSongs.length >= 15, // if JioSaavn returned a good batch, there's likely more
    };
    setCached(cacheKey, result, TTL_SEARCH);
    return result;
  },

  /** Search all (songs + albums + artists) */
  searchAll: async (q: string) => {
    const cacheKey = `searchAll:${q}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const [songs, albums, artists] = await Promise.allSettled([
      jiosaavn.searchSongs(q, 1, 30),
      jiosaavn.searchAlbums(q),
      jiosaavn.searchArtists(q),
    ]);

    const songResults = songs.status === 'fulfilled' ? songs.value : [];
    const result = {
      results: songResults,
      albums: albums.status === 'fulfilled' ? albums.value : [],
      artists: artists.status === 'fulfilled' ? artists.value : [],
      query: q,
      hasMore: songResults.length >= 20, // JioSaavn supports pagination if we got a decent batch
    };

    setCached(cacheKey, result, TTL_SEARCH);
    return result;
  },

  /** Trending songs for given language(s) */
  trending: async (lang = 'hindi') => {
    const cacheKey = `trending:${lang}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const [jsResults, ytResults] = await Promise.allSettled([
      jiosaavn.getTrending(lang),
      ytmusic.getTrending(10),
    ]);

    const songs = [
      ...(jsResults.status === 'fulfilled' ? jsResults.value : []),
      ...(ytResults.status === 'fulfilled' ? ytResults.value : []),
    ];

    setCached(cacheKey, songs, TTL_TRENDING);
    return songs;
  },

  /** Get song details by ID and source */
  song: async (id: string, source = 'jiosaavn') => {
    const cacheKey = `song:${source}:${id}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    let song = null;
    if (source === 'youtube') {
      // YouTube song details not available directly — return minimal object
      song = { id: `youtube-${id}`, source: 'youtube', sourceId: id, quality: 'high' };
    } else {
      song = await jiosaavn.getSongDetails(id);
    }

    if (song) setCached(cacheKey, song, TTL_SONG);
    return song;
  },

  /** Stream URL — always via server proxy for reliable audio */
  streamUrl: (id: string, source = 'jiosaavn') =>
    `${STREAM_BASE}/stream/${id}?source=${source}`,

  /** Get artist details */
  artist: async (id: string) => {
    const cacheKey = `artist:${id}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const result = await jiosaavn.getArtist(id);
    if (result) setCached(cacheKey, result, TTL_SONG);
    return result;
  },

  /** Get album details */
  album: async (id: string) => {
    const cacheKey = `album:${id}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const result = await jiosaavn.getAlbum(id);
    if (result) setCached(cacheKey, result, TTL_SONG);
    return result;
  },

  /** Get lyrics */
  lyrics: async (artist: string, track: string) => {
    const cacheKey = `lyrics:${artist}:${track}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const result = await lrclib.getLyrics(artist, track);
    if (result) setCached(cacheKey, result, TTL_SONG);
    return result;
  },

  /** Viral/trending — uses Hindi trending as viral proxy */
  viral: async () => {
    const cacheKey = 'viral';
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const songs = await jiosaavn.getTrending('hindi,english');
    setCached(cacheKey, songs, TTL_TRENDING);
    return songs;
  },

  /** Genre songs */
  genre: async (slug: string) => {
    const cacheKey = `genre:${slug}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const songs = await jiosaavn.getGenreSongs(slug);
    setCached(cacheKey, songs, TTL_GENRE);
    return songs;
  },

  /** Load more songs for a search query — for infinite scroll */
  searchMore: async (q: string, page: number) => {
    const cacheKey = `search:${q}:${page}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const songs = await jiosaavn.searchSongs(q, page, 30);
    const result = { results: songs, hasMore: songs.length >= 15 };
    setCached(cacheKey, result, TTL_SEARCH);
    return result;
  },

  /** Trending for additional languages — used for "load more" on trending screen */
  trendingMore: async (langs: string[]) => {
    const results: import('../types').Song[] = [];
    const seen = new Set<string>();
    for (const lang of langs) {
      try {
        const songs = await jiosaavn.getTrending(lang);
        for (const s of songs) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            results.push({ ...s, source: s.source === 'youtube' ? 'ytmusic' : s.source } as import('../types').Song);
          }
        }
      } catch { /* skip failed languages */ }
    }
    return results;
  },
};
