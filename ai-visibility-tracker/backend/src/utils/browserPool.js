import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import config from '../config/env.js';
import logger from './logger.js';

// Add stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Browser pool
const browsers = [];
const maxBrowsers = config.browserPoolSize || 2;
const maxUsesPerBrowser = 50;

// Browser metadata
const browserMeta = new Map();

// Launch browser with optimized settings
async function launchBrowser() {
  logger.info('Launching new browser instance');

  const browser = await puppeteer.launch({
    headless: config.puppeteerHeadless ? 'new' : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });

  // Track browser metadata
  browserMeta.set(browser, {
    uses: 0,
    createdAt: Date.now(),
    inUse: false,
  });

  // Handle browser disconnection
  browser.on('disconnected', () => {
    logger.warn('Browser disconnected');
    const index = browsers.indexOf(browser);
    if (index > -1) {
      browsers.splice(index, 1);
    }
    browserMeta.delete(browser);
  });

  browsers.push(browser);
  return browser;
}

// Get an available browser from the pool
export async function getBrowser() {
  // Find an available browser
  for (const browser of browsers) {
    const meta = browserMeta.get(browser);
    if (meta && !meta.inUse && meta.uses < maxUsesPerBrowser) {
      meta.inUse = true;
      meta.uses++;
      return browser;
    }
  }

  // If no available browser and pool not full, launch a new one
  if (browsers.length < maxBrowsers) {
    const browser = await launchBrowser();
    const meta = browserMeta.get(browser);
    meta.inUse = true;
    meta.uses++;
    return browser;
  }

  // Wait for a browser to become available
  logger.debug('Waiting for available browser...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return getBrowser();
}

// Release a browser back to the pool
export async function releaseBrowser(browser) {
  const meta = browserMeta.get(browser);
  if (!meta) {
    return;
  }

  meta.inUse = false;

  // If browser has been used too many times, close and remove it
  if (meta.uses >= maxUsesPerBrowser) {
    logger.info('Recycling browser due to max uses');
    const index = browsers.indexOf(browser);
    if (index > -1) {
      browsers.splice(index, 1);
    }
    browserMeta.delete(browser);
    await browser.close().catch(() => {});
  }
}

// Close all browsers
export async function closeAllBrowsers() {
  logger.info('Closing all browsers');
  for (const browser of browsers) {
    await browser.close().catch(() => {});
  }
  browsers.length = 0;
  browserMeta.clear();
}

// Cleanup on process exit
process.on('SIGTERM', closeAllBrowsers);
process.on('SIGINT', closeAllBrowsers);

export default { getBrowser, releaseBrowser, closeAllBrowsers };
