import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'default-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Encryption
  encryptionKey: process.env.ENCRYPTION_KEY,
  encryptionIv: process.env.ENCRYPTION_IV,

  // SERP API
  serpApiKey: process.env.SERP_API_KEY,

  // Firecrawl API (for Perplexity scraping)
  firecrawlApiKey: process.env.FIRECRAWL_API_KEY,

  // Puppeteer
  puppeteerHeadless: process.env.PUPPETEER_HEADLESS !== 'false',
  browserPoolSize: parseInt(process.env.BROWSER_POOL_SIZE || '2', 10),
  scanDelayMin: parseInt(process.env.SCAN_DELAY_MIN_MS || '3000', 10),
  scanDelayMax: parseInt(process.env.SCAN_DELAY_MAX_MS || '8000', 10),
  promptTimeout: parseInt(process.env.PROMPT_TIMEOUT_MS || '60000', 10),

  // Storage
  screenshotDir: process.env.SCREENSHOT_DIR || './screenshots',
  maxScreenshotSize: parseInt(process.env.MAX_SCREENSHOT_SIZE_MB || '5', 10),
};

export default config;
