import { Router, Request, Response } from 'express';
import * as jiosaavn from '../sources/jiosaavn';
import { getCached, setCached, cacheKey } from '../cache';

const router = Router();

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    console.log(`[ARTIST] id="${id}"`);

    const key = cacheKey('artist', id);
    const cached = getCached<Record<string, unknown>>(key);
    if (cached) {
      res.json({ data: cached, cached: true });
      return;
    }

    const artist = await jiosaavn.getArtist(id);

    if (!artist) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    setCached(key, artist, 3600); // 1 hour
    res.json({ data: artist, cached: false });
  } catch (err) {
    console.error('[ARTIST] Error:', (err as Error).message);
    res.status(500).json({ error: 'Failed to get artist', message: (err as Error).message });
  }
});

export default router;
