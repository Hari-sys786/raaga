import { Router, Request, Response } from 'express';
import * as spotify from '../sources/spotify';
import * as genius from '../sources/genius';
import * as musicbrainz from '../sources/musicbrainz';
import * as audiodb from '../sources/audiodb';
import * as lrclib from '../sources/lrclib';
import { getCached, setCached, cacheKey } from '../cache';

const router = Router();

interface MetadataResult {
  title: string;
  artist: string;
  album: string;
  artwork: string | null;
  artworkHiRes: string | null;
  artistArt: string | null;
  previewUrl: string | null;
  duration: number;
  popularity: number;
  releaseDate: string;
  spotifyUrl: string | null;
  geniusUrl: string | null;
  lyrics: string | null;
  syncedLyrics: string | null;
  sources: string[];
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    const track = req.query.track as string;
    const artist = req.query.artist as string;

    const query = q || `${track || ''} ${artist || ''}`.trim();
    if (!query) {
      res.status(400).json({ error: 'Provide q or track+artist params' });
      return;
    }

    console.log(`[METADATA] q="${query}"`);

    // Check cache
    const key = cacheKey('metadata', query.toLowerCase());
    const cached = getCached<MetadataResult>(key);
    if (cached) {
      res.json({ data: cached, cached: true });
      return;
    }

    const result: MetadataResult = {
      title: track || '',
      artist: artist || '',
      album: '',
      artwork: null,
      artworkHiRes: null,
      artistArt: null,
      previewUrl: null,
      duration: 0,
      popularity: 0,
      releaseDate: '',
      spotifyUrl: null,
      geniusUrl: null,
      lyrics: null,
      syncedLyrics: null,
      sources: [],
    };

    // Fire all sources in parallel for speed
    const [spotifyResult, geniusResult, mbResult, lrclibResult] = await Promise.allSettled([
      spotify.searchTrack(query),
      genius.searchSong(query),
      musicbrainz.searchRelease(track || query.split(' ')[0], artist || ''),
      lrclib.searchLyrics(query),
    ]);

    // 1. Spotify — primary metadata + art
    if (spotifyResult.status === 'fulfilled' && spotifyResult.value) {
      const s = spotifyResult.value;
      result.title = s.name || result.title;
      result.artist = s.artists || result.artist;
      result.album = s.album || result.album;
      result.artwork = s.albumArt || result.artwork;
      result.artworkHiRes = s.albumArt || result.artworkHiRes;
      result.previewUrl = s.previewUrl;
      result.duration = s.durationMs;
      result.popularity = s.popularity;
      result.releaseDate = s.releaseDate;
      result.spotifyUrl = s.spotifyUrl;
      result.sources.push('spotify');
    }

    // 2. Genius — lyrics + art fallback
    if (geniusResult.status === 'fulfilled' && geniusResult.value) {
      const g = geniusResult.value;
      result.geniusUrl = g.url;
      if (g.lyrics) {
        result.lyrics = g.lyrics;
        result.sources.push('genius');
      }
      if (!result.artwork && g.thumbnailUrl) {
        result.artwork = g.thumbnailUrl;
      }
    }

    // 3. MusicBrainz — art fallback + release info
    if (mbResult.status === 'fulfilled' && mbResult.value) {
      const mb = mbResult.value;
      if (!result.artwork && mb.coverArtUrl) {
        result.artwork = mb.coverArtUrl;
        result.artworkHiRes = mb.coverArtUrl;
      }
      if (!result.releaseDate && mb.date) {
        result.releaseDate = mb.date;
      }
      result.sources.push('musicbrainz');
    }

    // 4. LRCLIB — synced lyrics fallback
    if (lrclibResult.status === 'fulfilled' && lrclibResult.value) {
      const lrc = lrclibResult.value;
      const best = Array.isArray(lrc) ? lrc[0] : lrc;
      if (best) {
        if (!result.lyrics && best.plainLyrics) {
          result.lyrics = best.plainLyrics;
        }
        if (best.syncedLyrics) {
          result.syncedLyrics = best.syncedLyrics;
        }
        if (!result.sources.includes('lrclib')) result.sources.push('lrclib');
      }
    }

    // 5. TheAudioDB — hi-res art fallback (only if still no artwork)
    if (!result.artworkHiRes && result.artist) {
      try {
        const albumArt = await audiodb.getAlbumArt(result.artist, result.album || result.title);
        if (albumArt) {
          result.artworkHiRes = albumArt;
          if (!result.artwork) result.artwork = albumArt;
          result.sources.push('audiodb');
        }
      } catch { /* skip */ }
    }

    // 6. Artist art from Spotify or AudioDB
    if (result.artist) {
      try {
        const sArt = await spotify.getArtistArt(result.artist);
        if (sArt) {
          result.artistArt = sArt;
        } else {
          const aArt = await audiodb.getArtistArt(result.artist);
          if (aArt?.artistThumb) result.artistArt = aArt.artistThumb;
        }
      } catch { /* skip */ }
    }

    // Cache for 1 hour
    setCached(key, result, 3600);

    res.json({ data: result, cached: false });
  } catch (err) {
    console.error('[METADATA] Error:', (err as Error).message);
    res.status(500).json({ error: 'Metadata fetch failed', message: (err as Error).message });
  }
});

export default router;
