import { Router, Request, Response } from 'express';
import * as jiosaavn from '../sources/jiosaavn';
import * as piped from '../sources/piped';
import * as ytmusic from '../sources/ytmusic';
import { getCached, setCached, cacheKey } from '../cache';
import { Song } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawQuery = req.query.q as string;
    const type = (req.query.type as string) || 'song';
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);

    if (!rawQuery || typeof rawQuery !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    const query = rawQuery.trim().slice(0, 200).replace(/[\x00-\x1F\x7F]/g, '');

    if (query.length < 1) {
      res.status(400).json({ error: 'Query too short' });
      return;
    }

    const validTypes = ['song', 'album', 'artist', 'all'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: `Invalid type. Use: ${validTypes.join(', ')}` });
      return;
    }

    console.log(`[SEARCH] q="${query}" type="${type}" page=${page} limit=${limit}`);

    const key = cacheKey('search', type, query, String(page));
    const cached = getCached<Record<string, unknown>>(key);
    if (cached) {
      console.log(`[SEARCH] Cache hit for "${query}" p${page}`);
      res.json({ ...cached, query, cached: true });
      return;
    }

    if (type === 'all') {
      // Return songs, albums, and artists in one response
      const [songs, albums, artists] = await Promise.all([
        jiosaavn.searchSongs(query, page, limit),
        jiosaavn.searchAlbums(query),
        jiosaavn.searchArtists(query),
      ]);

      // Also search YouTube Music if JioSaavn results are few
      let mergedSongs = songs;
      if (songs.length < 5) {
        try {
          const ytResults = await ytmusic.searchSongs(query, 15);
          const existingTitles = new Set(songs.map(r => r.title.toLowerCase()));
          for (const yt of ytResults) {
            if (!existingTitles.has(yt.title.toLowerCase())) {
              mergedSongs.push(yt);
            }
          }
        } catch {}
      }

      const response = {
        results: mergedSongs,
        albums,
        artists,
        total: mergedSongs.length,
        page,
        hasMore: mergedSongs.length >= limit,
      };
      setCached(key, response, 300);
      res.json({ ...response, query, cached: false });
      return;
    }

    // Songs search with pagination
    let results: Song[] = [];

    if (type === 'song' || type === 'album' || type === 'artist') {
      results = await jiosaavn.searchSongs(query, page, limit);
    }

    // If < 3 results on page 1, also search YouTube Music
    if (results.length < 3 && page === 1 && type === 'song') {
      try {
        const ytResults = await ytmusic.searchSongs(query, 15);
        const existingTitles = new Set(results.map(r => r.title.toLowerCase()));
        for (const yt of ytResults) {
          if (!existingTitles.has(yt.title.toLowerCase())) {
            results.push(yt);
          }
        }
      } catch (err) {
        console.warn('[SEARCH] YTMusic search failed:', (err as Error).message);
      }
    }

    const response = { results, total: results.length, page, hasMore: results.length >= limit };
    setCached(key, response, 300);

    res.json({ ...response, query, cached: false });
  } catch (err) {
    console.error('[SEARCH] Error:', (err as Error).message);
    res.status(500).json({ error: 'Search failed', message: (err as Error).message });
  }
});

export default router;
