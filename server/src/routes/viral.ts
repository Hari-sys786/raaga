import { Router, Request, Response } from 'express';
import * as jiosaavn from '../sources/jiosaavn';
import * as piped from '../sources/piped';
import * as ytmusic from '../sources/ytmusic';
import { getCached, setCached, cacheKey } from '../cache';
import { Song } from '../types';

const router = Router();

const VIRAL_TTL = 12 * 60 * 60; // 12 hours

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[VIRAL] Fetching viral songs');

    const key = cacheKey('viral', 'all');
    const cached = getCached<Song[]>(key);
    if (cached) {
      console.log('[VIRAL] Cache hit');
      res.json({ data: cached, total: cached.length, cached: true });
      return;
    }

    const results: Song[] = [];
    const seenTitles = new Set<string>();

    // Fetch from JioSaavn trending (multiple languages)
    try {
      const saavnSongs = await jiosaavn.getTrending('hindi,english,telugu,tamil,punjabi');
      for (const song of saavnSongs) {
        const key = song.title.toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          results.push(song);
        }
      }
    } catch (err) {
      console.warn('[VIRAL] JioSaavn trending failed:', (err as Error).message);
    }

    // Fetch from YouTube Music trending (primary), Piped as fallback
    try {
      const ytSongs = await ytmusic.getTrending(20);
      for (const song of ytSongs) {
        const key = song.title.toLowerCase();
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          results.push(song);
        }
      }
    } catch (err) {
      console.warn('[VIRAL] YTMusic trending failed:', (err as Error).message);
      // Fallback to Piped
      try {
        const pipedSongs = await piped.getTrending();
        for (const song of pipedSongs) {
          const key = song.title.toLowerCase();
          if (!seenTitles.has(key)) {
            seenTitles.add(key);
            results.push(song);
          }
        }
      } catch (err2) {
        console.warn('[VIRAL] Piped fallback also failed:', (err2 as Error).message);
      }
    }

    setCached(key, results, VIRAL_TTL);
    res.json({ data: results, total: results.length, cached: false });
  } catch (err) {
    console.error('[VIRAL] Error:', (err as Error).message);
    res.status(500).json({ error: 'Failed to get viral songs', message: (err as Error).message });
  }
});

export default router;
