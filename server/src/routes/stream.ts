import { Router, Request, Response } from 'express';
import axios from 'axios';
import * as jiosaavn from '../sources/jiosaavn';
import * as piped from '../sources/piped';

const router = Router();

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const source = (req.query.source as string) || 'jiosaavn';

    console.log(`[STREAM] id="${id}" source="${source}"`);

    let streamUrl: string | null = null;

    if (source === 'jiosaavn') {
      const song = await jiosaavn.getSongDetails(id);
      streamUrl = song?.streamUrl || null;
    } else if (source === 'youtube') {
      const result = await piped.getStreamUrl(id);
      streamUrl = result?.url || null;
    }

    if (!streamUrl) {
      res.status(404).json({ error: 'Stream not found' });
      return;
    }

    // Proxy the audio stream to avoid CORS issues
    const audioResponse = await axios.get(streamUrl, {
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    // Forward content headers
    const contentType = audioResponse.headers['content-type'];
    const contentLength = audioResponse.headers['content-length'];

    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    audioResponse.data.pipe(res);
  } catch (err) {
    console.error('[STREAM] Error:', (err as Error).message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed', message: (err as Error).message });
    }
  }
});

export default router;
