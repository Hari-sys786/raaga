import { Router, Request, Response } from 'express';
import * as jiosaavn from '../sources/jiosaavn';
import { getCached, setCached, cacheKey } from '../cache';

const router = Router();

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    console.log(`[ALBUM] id="${id}"`);

    const key = cacheKey('album', id);
    const cached = getCached<{ album: Record<string, unknown>; songs: unknown[] }>(key);
    if (cached) {
      res.json({ data: cached, cached: true });
      return;
    }

    const result = await jiosaavn.getAlbum(id);

    if (!result) {
      res.status(404).json({ error: 'Album not found' });
      return;
    }

    setCached(key, result, 3600); // 1 hour
    res.json({ data: result, cached: false });
  } catch (err) {
    console.error('[ALBUM] Error:', (err as Error).message);
    res.status(500).json({ error: 'Failed to get album', message: (err as Error).message });
  }
});

export default router;
