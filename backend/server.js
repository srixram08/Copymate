import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Body normalization middleware
app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    try { req.body = JSON.parse(req.body); } catch (e) {}
  }
  req.body = req.body || {};
  next();
});

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/shops', '/shops'], shopsRouter);
app.use(['/api/documents', '/documents'], documentsRouter);
app.use(['/api/orders', '/orders'], ordersRouter);
app.use(['/api/delivery', '/delivery'], deliveryRouter);
app.use(['/api/admin', '/admin'], adminRouter);

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const HOST = process.env.HOST || '0.0.0.0';

// Export Express app for Vercel Serverless deployments
export default app;

// Start Server locally
if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
    console.log(`CopyMate backend server is running on http://${displayHost}:${PORT}`);
  });
}
