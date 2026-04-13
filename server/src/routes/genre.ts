import { Router, Request, Response } from 'express';
import { getGenreSongs } from '../sources/jiosaavn';
import { getCached, setCached, cacheKey } from '../cache';
import { Song } from '../types';

const router = Router();

const GENRE_TTL = 3 * 60 * 60; // 3 hours

router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug.toLowerCase().trim();

    if (!slug) {
      res.status(400).json({ error: 'Genre slug is required' });
      return;
    }

    console.log(`[GENRE] slug="${slug}"`);

    const key = cacheKey('genre', slug);
    const cached = getCached<Song[]>(key);
    if (cached) {
      console.log(`[GENRE] Cache hit for "${slug}"`);
      res.json({ data: cached, total: cached.length, cached: true });
      return;
    }

    const songs = await getGenreSongs(slug);

    setCached(key, songs, GENRE_TTL);
    res.json({ data: songs, total: songs.length, cached: false });
  } catch (err) {
    console.error('[GENRE] Error:', (err as Error).message);
    res.status(500).json({ error: 'Failed to get genre songs', message: (err as Error).message });
  }
});

export default router;
