/**
 * Token Validator Service
 * Validates session tokens and tracks their status
 *
 * Created: February 18, 2026
 * Purpose: Notify users when their session tokens expire
 */

import crypto from 'crypto';
import { getBrowser, releaseBrowser } from '../utils/browserPool.js';
import logger from '../utils/logger.js';
import prisma from '../config/database.js';
import config from '../config/env.js';

// Decrypt helper (same as in settings.controller.js)
function decrypt(encrypted) {
  if (!encrypted) return null;
  if (!config.encryptionKey || !config.encryptionIv) {
    return null;
  }

  try {
    const key = Buffer.from(config.encryptionKey, 'hex');
    const iv = Buffer.from(config.encryptionIv, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error.message);
    return null;
  }
}

const CHATGPT_URL = 'https://chatgpt.com';
const PERPLEXITY_URL = 'https://www.perplexity.ai';

/**
 * Validate ChatGPT session token
 * Returns { valid: boolean, message: string, expiresAt?: Date }
 */
export async function validateChatGPTToken(sessionToken) {
  if (!sessionToken) {
    return { valid: false, message: 'No session token provided', engine: 'chatgpt' };
  }

  let browser = null;
  let page = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Set session cookie
    await page.setCookie({
      name: '__Secure-next-auth.session-token',
      value: sessionToken,
      domain: '.chatgpt.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    });

    // Navigate to ChatGPT
    await page.goto(CHATGPT_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check if we're logged in or on login page
    const currentUrl = page.url();
    const pageContent = await page.content();

    // Check for login indicators
    const isLoginPage = currentUrl.includes('/auth/login') ||
      (pageContent.includes('Log in') && pageContent.includes('Sign up') && !pageContent.includes('prompt-textarea'));

    // Check for chat input (indicates logged in)
    const hasChatInput = await page.$('#prompt-textarea, textarea[data-id="root"]');

    if (isLoginPage || !hasChatInput) {
      return {
        valid: false,
        message: 'Session token expired or invalid. Please get a new token from ChatGPT.',
        engine: 'chatgpt',
        expiredAt: new Date(),
      };
    }

    return {
      valid: true,
      message: 'ChatGPT session token is valid',
      engine: 'chatgpt',
      validatedAt: new Date(),
    };

  } catch (error) {
    logger.error('ChatGPT token validation error:', error.message);
    return {
      valid: false,
      message: `Validation error: ${error.message}`,
      engine: 'chatgpt',
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await releaseBrowser(browser);
  }
}

/**
 * Validate Perplexity session token
 */
export async function validatePerplexityToken(sessionToken) {
  if (!sessionToken) {
    return { valid: false, message: 'No session token provided', engine: 'perplexity' };
  }

  let browser = null;
  let page = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 720 });

    // Set session cookie
    await page.setCookie({
      name: 'pplx.session',
      value: sessionToken,
      domain: '.perplexity.ai',
      path: '/',
      secure: true,
      httpOnly: true,
    });

    await page.goto(PERPLEXITY_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Check for logged-in indicators
    const isLoggedIn = await page.evaluate(() => {
      const hasSearchInput = document.querySelector('textarea[placeholder*="Ask"]');
      const hasLoginButton = document.querySelector('button[data-testid="sign-in-button"]');
      return hasSearchInput && !hasLoginButton;
    });

    if (!isLoggedIn) {
      return {
        valid: false,
        message: 'Perplexity session token expired. Please get a new token.',
        engine: 'perplexity',
        expiredAt: new Date(),
      };
    }

    return {
      valid: true,
      message: 'Perplexity session token is valid',
      engine: 'perplexity',
      validatedAt: new Date(),
    };

  } catch (error) {
    logger.error('Perplexity token validation error:', error.message);
    return {
      valid: false,
      message: `Validation error: ${error.message}`,
      engine: 'perplexity',
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (browser) await releaseBrowser(browser);
  }
}

/**
 * Validate all tokens for a user and update status in database
 */
export async function validateAllTokens(userId) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    return {
      chatgpt: { valid: false, message: 'No settings found' },
      perplexity: { valid: false, message: 'No settings found' },
      serpApi: { valid: !!settings?.serpApiKey, message: settings?.serpApiKey ? 'API key configured' : 'No API key' },
    };
  }

  const results = {
    chatgpt: { valid: false, message: 'Not configured' },
    perplexity: { valid: false, message: 'Not configured' },
    serpApi: { valid: !!settings.serpApiKey, message: settings.serpApiKey ? 'API key configured' : 'Not configured' },
  };

  // Validate ChatGPT token if exists (decrypt first)
  if (settings.chatgptSessionToken) {
    const decryptedToken = decrypt(settings.chatgptSessionToken);
    if (decryptedToken) {
      results.chatgpt = await validateChatGPTToken(decryptedToken);
    } else {
      results.chatgpt = { valid: false, message: 'Failed to decrypt token' };
    }
  }

  // Validate Perplexity token if exists (decrypt first)
  if (settings.perplexitySessionToken) {
    const decryptedToken = decrypt(settings.perplexitySessionToken);
    if (decryptedToken) {
      results.perplexity = await validatePerplexityToken(decryptedToken);
    } else {
      results.perplexity = { valid: false, message: 'Failed to decrypt token' };
    }
  }

  // Update last validation timestamp in database
  await prisma.userSettings.update({
    where: { userId },
    data: {
      lastTokenValidation: new Date(),
      chatgptTokenValid: results.chatgpt.valid,
      perplexityTokenValid: results.perplexity.valid,
    },
  });

  return results;
}

/**
 * Quick check without browser - just checks if token exists and last validation
 */
export async function getTokenStatus(userId) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    return {
      chatgpt: { configured: false, lastValidation: null, valid: null },
      perplexity: { configured: false, lastValidation: null, valid: null },
      serpApi: { configured: false },
      lastValidation: null,
    };
  }

  return {
    chatgpt: {
      configured: !!settings.chatgptSessionToken,
      valid: settings.chatgptTokenValid,
      lastValidation: settings.lastTokenValidation,
    },
    perplexity: {
      configured: !!settings.perplexitySessionToken,
      valid: settings.perplexityTokenValid,
      lastValidation: settings.lastTokenValidation,
    },
    serpApi: {
      configured: !!settings.serpApiKey,
    },
    lastValidation: settings.lastTokenValidation,
  };
}

export default {
  validateChatGPTToken,
  validatePerplexityToken,
  validateAllTokens,
  getTokenStatus,
};
