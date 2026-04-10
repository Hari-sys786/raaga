import { Router, Request, Response } from 'express';
import * as jiosaavn from '../sources/jiosaavn';
import * as piped from '../sources/piped';
import { getCached, setCached, cacheKey } from '../cache';
import { Song } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawQuery = req.query.q as string;
    const type = (req.query.type as string) || 'song';

    if (!rawQuery || typeof rawQuery !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    // Sanitize: trim, limit length, strip control chars
    const query = rawQuery.trim().slice(0, 200).replace(/[\x00-\x1F\x7F]/g, '');

    if (query.length < 1) {
      res.status(400).json({ error: 'Query too short' });
      return;
    }

    const validTypes = ['song', 'album', 'artist'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: `Invalid type. Use: ${validTypes.join(', ')}` });
      return;
    }

    console.log(`[SEARCH] q="${query}" type="${type}"`);

    const key = cacheKey('search', type, query);
    const cached = getCached<{ results: Song[]; total: number }>(key);
    if (cached) {
      console.log(`[SEARCH] Cache hit for "${query}"`);
      res.json({ ...cached, query, cached: true });
      return;
    }

    // Search JioSaavn first
    let results: Song[] = [];

    if (type === 'song' || type === 'album' || type === 'artist') {
      results = await jiosaavn.searchSongs(query);
    }

    // If < 3 results, also search Piped
    if (results.length < 3 && (type === 'song')) {
      try {
        const pipedResults = await piped.searchSongs(query);
        // Merge, avoiding duplicates by title similarity
        const existingTitles = new Set(results.map(r => r.title.toLowerCase()));
        for (const pr of pipedResults) {
          if (!existingTitles.has(pr.title.toLowerCase())) {
            results.push(pr);
          }
        }
      } catch (err) {
        console.warn('[SEARCH] Piped search failed, using JioSaavn results only:', (err as Error).message);
      }
    }

    const response = { results, total: results.length };
    setCached(key, response, 300); // Cache 5 minutes

    res.json({ ...response, query, cached: false });
  } catch (err) {
    console.error('[SEARCH] Error:', (err as Error).message);
    res.status(500).json({ error: 'Search failed', message: (err as Error).message });
  }
});

export default router;
