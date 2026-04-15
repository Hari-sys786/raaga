import { Router, Request, Response } from 'express';
import { getGenreSongs } from '../sources/jiosaavn';
import * as ytmusic from '../sources/ytmusic';
import { getCached, setCached, cacheKey } from '../cache';
import { Song } from '../types';

const router = Router();

const GENRE_TTL = 3 * 60 * 60; // 3 hours

// YouTube search queries per genre/mood — complements JioSaavn with YouTube catalog
const PIPED_GENRE_QUERIES: Record<string, string[]> = {
  lofi: ['lofi hip hop beats', 'lofi chill mix'],
  edm: ['edm mix 2025', 'electronic dance music'],
  focus: ['study music focus', 'concentration music instrumental'],
  classical: ['indian classical music raga', 'hindustani classical'],
  rock: ['hindi rock songs', 'indian rock music'],
  hiphop: ['desi hip hop 2025', 'indian rap songs'],
  rain: ['rain songs bollywood', 'monsoon hindi playlist'],
  workout: ['workout music hindi', 'gym motivation songs'],
  chill: ['chill vibes hindi', 'chill music playlist'],
  devotional: ['morning aarti bhajan', 'bhakti songs hindi'],
  sufi: ['sufi music best', 'sufi songs hindi'],
};

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

    // Fetch from JioSaavn (primary)
    const songs = await getGenreSongs(slug);
    const seenTitles = new Set(songs.map(s => s.title.toLowerCase()));

    // Enrich with YouTube Music results for genres that benefit from it
    const ytQueries = PIPED_GENRE_QUERIES[slug];
    if (ytQueries) {
      for (const query of ytQueries) {
        try {
          const ytSongs = await ytmusic.searchSongs(query, 15);
          for (const yt of ytSongs) {
            if (!seenTitles.has(yt.title.toLowerCase()) && songs.length < 60) {
              seenTitles.add(yt.title.toLowerCase());
              songs.push(yt);
            }
          }
        } catch (err) {
          console.warn(`[GENRE] YTMusic search "${query}" failed:`, (err as Error).message);
        }
      }
    }

    setCached(key, songs, GENRE_TTL);
    res.json({ data: songs, total: songs.length, cached: false });
  } catch (err) {
    console.error('[GENRE] Error:', (err as Error).message);
    res.status(500).json({ error: 'Failed to get genre songs', message: (err as Error).message });
  }
});

export default router;
