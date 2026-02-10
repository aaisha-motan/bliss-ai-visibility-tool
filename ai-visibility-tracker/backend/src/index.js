import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import config from './config/env.js';
import prisma from './config/database.js';
import logger from './utils/logger.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import clientRoutes from './routes/client.routes.js';
import scanRoutes from './routes/scan.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import connectRoutes from './routes/connect.routes.js';

// Initialize scan worker
import './jobs/scanWorker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Ensure directories exist
const screenshotDir = config.screenshotDir;
const logsDir = join(__dirname, '../logs');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Static files for screenshots
app.use('/api/screenshots', express.static(screenshotDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/connect', connectRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const port = config.port;

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export default app;
