import { Router, Request, Response } from 'express';
import * as jiosaavn from '../sources/jiosaavn';
import * as piped from '../sources/piped';
import { getCached, setCached, cacheKey } from '../cache';
import { Song } from '../types';

const router = Router();

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const source = (req.query.source as string) || 'jiosaavn';

    console.log(`[SONG] id="${id}" source="${source}"`);

    const key = cacheKey('song', source, id);
    const cached = getCached<Song>(key);
    if (cached) {
      res.json({ data: cached, cached: true });
      return;
    }

    let song: Song | null = null;

    if (source === 'jiosaavn') {
      song = await jiosaavn.getSongDetails(id);
    } else if (source === 'youtube') {
      song = await piped.getStreamDetails(id);
    }

    if (!song) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }

    setCached(key, song, 3600); // Cache 1 hour
    res.json({ data: song, cached: false });
  } catch (err) {
    console.error('[SONG] Error:', (err as Error).message);
    res.status(500).json({ error: 'Failed to get song details', message: (err as Error).message });
  }
});

export default router;
