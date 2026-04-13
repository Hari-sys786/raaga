import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as jiosaavn from '../sources/jiosaavn';
import * as piped from '../sources/piped';

const router = Router();

async function proxyStream(streamUrl: string, res: Response): Promise<boolean> {
  try {
    const audioResponse = await axios.get(streamUrl, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = audioResponse.headers['content-type'];
    const contentLength = audioResponse.headers['content-length'];

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    audioResponse.data.pipe(res);
    return true;
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.response?.status === 451) {
      return false; // URL dead, try next quality
    }
    throw err;
  }
}

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const source = (req.query.source as string) || 'jiosaavn';

    console.log(`[STREAM] id="${id}" source="${source}"`);

    if (source === 'jiosaavn') {
      const sourceId = id.startsWith('jiosaavn-') ? id.slice(9) : id;
      const song = await jiosaavn.getSongDetails(sourceId);

      if (!song?.streamUrl) {
        res.status(404).json({ error: 'Stream not found' });
        return;
      }

      // Try the primary stream URL
      const streamed = await proxyStream(song.streamUrl, res);
      if (streamed) return;

      // If 404/451, try lower qualities from the URL pattern
      const baseUrl = song.streamUrl.replace(/_\d+\.mp4$/, '');
      for (const q of ['160', '96', '48', '12']) {
        const fallbackUrl = `${baseUrl}_${q}.mp4`;
        console.log(`[STREAM] Trying fallback quality ${q}kbps`);
        const ok = await proxyStream(fallbackUrl, res);
        if (ok) return;
      }

      res.status(404).json({ error: 'All stream qualities failed' });
      return;
    }

    if (source === 'youtube') {
      const youtubeId = id.startsWith('youtube-') ? id.slice(8) : id;
      const result = await piped.getStreamUrl(youtubeId);
      if (!result?.url) {
        res.status(404).json({ error: 'Stream not found' });
        return;
      }
      await proxyStream(result.url, res);
      return;
    }

    res.status(400).json({ error: 'Unknown source' });
  } catch (err) {
    console.error('[STREAM] Error:', (err as Error).message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed', message: (err as Error).message });
    }
  }
});

export default router;
