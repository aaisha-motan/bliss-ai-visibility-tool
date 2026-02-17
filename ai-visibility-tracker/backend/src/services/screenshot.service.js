import path from 'path';
import fs from 'fs';
import config from '../config/env.js';
import logger from '../utils/logger.js';

// Ensure screenshot directory exists
const screenshotDir = config.screenshotDir;
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

export async function takeScreenshot(page, name) {
  try {
    const filename = `${name}.png`;
    const filepath = path.join(screenshotDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png',
    });

    logger.debug(`Screenshot saved: ${filename}`);
    return filename;
  } catch (error) {
    logger.error('Failed to take screenshot:', error);
    return null;
  }
}

export async function takeFullPageScreenshot(page, name) {
  try {
    const filename = `${name}_full.png`;
    const filepath = path.join(screenshotDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true,
      type: 'png',
    });

    logger.debug(`Full page screenshot saved: ${filename}`);
    return filename;
  } catch (error) {
    logger.error('Failed to take full page screenshot:', error);
    return null;
  }
}

export async function takeViewportScreenshot(page, name) {
  try {
    const filename = `${name}.png`;
    const filepath = path.join(screenshotDir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: false,
      type: 'png',
    });

    logger.debug(`Viewport screenshot saved: ${filename}`);
    return filename;
  } catch (error) {
    logger.error('Failed to take viewport screenshot:', error);
    return null;
  }
}

export function getScreenshotPath(filename) {
  return path.join(screenshotDir, filename);
}

export function deleteScreenshot(filename) {
  try {
    const filepath = path.join(screenshotDir, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      logger.debug(`Screenshot deleted: ${filename}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to delete screenshot:', error);
    return false;
  }
}

export default { takeScreenshot, takeFullPageScreenshot, takeViewportScreenshot, getScreenshotPath, deleteScreenshot };
