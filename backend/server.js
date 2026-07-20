import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Import routers
import authRouter from './routes/auth.js';
import shopsRouter from './routes/shops.js';
import documentsRouter from './routes/documents.js';
import ordersRouter from './routes/orders.js';
import deliveryRouter from './routes/delivery.js';
import adminRouter from './routes/admin.js';

import { connectDB } from './config/db.js';

dotenv.config();

// Connect MongoDB Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Body normalization middleware
app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch (e) {}
  }
  req.body = req.body || {};
  next();
});

// Serve uploaded documents statically
const uploadsDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Keep-alive: prevent Render free tier from sleeping (ping every 14 min)
if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
  const PING_URL = process.env.RENDER_EXTERNAL_URL + '/api/health';
  setInterval(async () => {
    try {
      const https = await import('https');
      https.get(PING_URL, () => {}).on('error', () => {});
    } catch {}
  }, 14 * 60 * 1000); // every 14 minutes
  console.log('🔄 Keep-alive ping enabled:', PING_URL);
}

// ─── Serve Frontend Static Files (for Render single-service deployment) ──────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // React Router: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const HOST = process.env.HOST || '0.0.0.0';

// Export Express app for Vercel Serverless deployments
export default app;

// Start Server (local + Render)
if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`✅ CopyMate server running on http://${displayHost}:${PORT}`);
  });
}
