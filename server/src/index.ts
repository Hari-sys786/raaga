import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import searchRoutes from './routes/search';
import songRoutes from './routes/song';
import streamRoutes from './routes/stream';
import trendingRoutes from './routes/trending';
import artistRoutes from './routes/artist';
import albumRoutes from './routes/album';
import lyricsRoutes from './routes/lyrics';
import viralRoutes from './routes/viral';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3080', 10);

// CORS — allow all origins for the music player
app.use(cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Rate limiting — prevent abuse
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});
app.use('/api/', limiter);

// Stricter limit for stream/download endpoints
const streamLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 streams per minute per IP
  message: { error: 'Too many stream requests.' },
});
app.use('/api/stream/', streamLimiter);

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'raaga-api', uptime: process.uptime() });
});

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/song', songRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/album', albumRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/viral', viralRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 Raaga API server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Search: http://localhost:${PORT}/api/search?q=test`);
});

export default app;
