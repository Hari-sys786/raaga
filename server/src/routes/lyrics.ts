import { Router, Request, Response } from 'express';
import * as lrclib from '../sources/lrclib';
import { getCached, setCached, cacheKey } from '../cache';
import { LyricsResult } from '../types';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const artist = req.query.artist as string;
    const track = req.query.track as string;
    const q = req.query.q as string;

    console.log(`[LYRICS] artist="${artist || ''}" track="${track || ''}" q="${q || ''}"`);

    if (!artist && !track && !q) {
      res.status(400).json({ error: 'Provide artist+track or q parameter' });
      return;
    }

    // If artist+track, try exact match first
    if (artist && track) {
      const key = cacheKey('lyrics', artist, track);
      const cached = getCached<LyricsResult>(key);
      if (cached) {
        res.json({ data: cached, cached: true });
        return;
      }

      try {
        const lyrics = await lrclib.getLyrics(artist, track);
        if (lyrics) {
          setCached(key, lyrics, 86400); // 24 hours
          res.json({ data: lyrics, cached: false });
          return;
        }
      } catch {
        // Fall through to search
      }
    }

    // Fallback to search
    const searchQuery = q || `${artist || ''} ${track || ''}`.trim();
    const key = cacheKey('lyrics-search', searchQuery);
    const cached = getCached<LyricsResult[]>(key);
    if (cached) {
      res.json({ data: cached, total: cached.length, cached: true });
      return;
    }

    const results = await lrclib.searchLyrics(searchQuery);
    setCached(key, results, 86400);
    res.json({ data: results, total: results.length, cached: false });
  } catch (err) {
    console.error('[LYRICS] Error:', (err as Error).message);
    res.status(500).json({ error: 'Failed to get lyrics', message: (err as Error).message });
  }
});

export default router;
