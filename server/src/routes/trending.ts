import { Router, Request, Response } from 'express';
import * as jiosaavn from '../sources/jiosaavn';
import { getCached, setCached, cacheKey } from '../cache';
import { Song } from '../types';

const router = Router();

const TRENDING_TTL = 6 * 60 * 60; // 6 hours

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = (req.query.lang as string) || 'hindi';

    console.log(`[TRENDING] lang="${lang}"`);

    const key = cacheKey('trending', lang);
    const cached = getCached<Song[]>(key);
    if (cached) {
      console.log(`[TRENDING] Cache hit for "${lang}"`);
      res.json({ data: cached, total: cached.length, cached: true });
      return;
    }

    const songs = await jiosaavn.getTrending(lang);

    setCached(key, songs, TRENDING_TTL);
    res.json({ data: songs, total: songs.length, cached: false });
  } catch (err) {
    console.error('[TRENDING] Error:', (err as Error).message);
    res.status(500).json({ error: 'Failed to get trending', message: (err as Error).message });
  }
});

export default router;
