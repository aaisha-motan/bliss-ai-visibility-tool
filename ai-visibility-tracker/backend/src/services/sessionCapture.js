import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import logger from '../utils/logger.js';

puppeteer.use(StealthPlugin());

// Store active login sessions
const activeSessions = new Map();

const PLATFORMS = {
  chatgpt: {
    name: 'ChatGPT',
    loginUrl: 'https://chat.openai.com/auth/login',
    successUrl: 'https://chat.openai.com',
    checkSelector: 'textarea[id="prompt-textarea"], #prompt-textarea',
    cookieName: '__Secure-next-auth.session-token',
  },
  perplexity: {
    name: 'Perplexity',
    loginUrl: 'https://www.perplexity.ai/login',
    successUrl: 'https://www.perplexity.ai',
    checkSelector: 'textarea[placeholder*="Ask"]',
    cookieName: null, // We'll capture all cookies
  },
};

/**
 * Start a login session - opens browser for user to log in
 */
export async function startLoginSession(userId, platform) {
  const config = PLATFORMS[platform];
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  // Close any existing session for this user/platform
  const sessionKey = `${userId}-${platform}`;
  if (activeSessions.has(sessionKey)) {
    await closeLoginSession(userId, platform);
  }

  logger.info(`Starting ${platform} login session for user ${userId}`);

  const browser = await puppeteer.launch({
    headless: false, // Visible browser for user to log in
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1200,800',
      '--window-position=100,100',
    ],
    defaultViewport: { width: 1200, height: 800 },
  });

  const page = await browser.newPage();

  // Navigate to login page
  await page.goto(config.loginUrl, { waitUntil: 'networkidle2' });

  // Store session info
  activeSessions.set(sessionKey, {
    browser,
    page,
    platform,
    config,
    startedAt: Date.now(),
  });

  return {
    sessionKey,
    platform: config.name,
    message: `Browser opened. Please log in to ${config.name}. Click "Complete Login" when done.`,
  };
}

/**
 * Check login status and capture cookies if logged in
 */
export async function checkLoginStatus(userId, platform) {
  const sessionKey = `${userId}-${platform}`;
  const session = activeSessions.get(sessionKey);

  if (!session) {
    return { status: 'no_session', message: 'No active login session' };
  }

  const { page, config } = session;

  try {
    // Check if browser is still open
    if (!page || page.isClosed()) {
      activeSessions.delete(sessionKey);
      return { status: 'closed', message: 'Browser was closed' };
    }

    const currentUrl = page.url();

    // Check if we're on the success page
    if (currentUrl.includes(config.successUrl.replace('https://', ''))) {
      // Try to find the logged-in indicator
      try {
        await page.waitForSelector(config.checkSelector, { timeout: 2000 });
        return { status: 'logged_in', message: 'Login detected! Ready to capture session.' };
      } catch {
        return { status: 'pending', message: 'Still on login page...' };
      }
    }

    return { status: 'pending', message: 'Waiting for login...' };
  } catch (error) {
    logger.error('Error checking login status:', error);
    return { status: 'error', message: error.message };
  }
}

/**
 * Complete login and capture cookies
 */
export async function completeLogin(userId, platform) {
  const sessionKey = `${userId}-${platform}`;
  const session = activeSessions.get(sessionKey);

  if (!session) {
    throw new Error('No active login session');
  }

  const { browser, page, config } = session;

  try {
    // Get all cookies
    const cookies = await page.cookies();

    logger.info(`Captured ${cookies.length} cookies for ${platform}`);

    // For ChatGPT, find the specific session token
    let sessionToken = null;

    if (platform === 'chatgpt') {
      const sessionCookie = cookies.find(c => c.name === config.cookieName);
      if (sessionCookie) {
        sessionToken = sessionCookie.value;
      } else {
        // Try to get from all cookies
        const authCookies = cookies.filter(c =>
          c.name.includes('session') || c.name.includes('auth') || c.name.includes('token')
        );
        if (authCookies.length > 0) {
          // Store all auth-related cookies as JSON
          sessionToken = JSON.stringify(authCookies.map(c => ({
            name: c.name,
            value: c.value,
            domain: c.domain,
          })));
        }
      }
    } else if (platform === 'perplexity') {
      // For Perplexity, store all cookies
      const relevantCookies = cookies.filter(c =>
        c.domain.includes('perplexity')
      );
      sessionToken = JSON.stringify(relevantCookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
      })));
    }

    // Close browser
    await browser.close();
    activeSessions.delete(sessionKey);

    if (!sessionToken) {
      throw new Error('Could not capture session token. Please try logging in again.');
    }

    logger.info(`Successfully captured ${platform} session for user ${userId}`);

    return {
      success: true,
      sessionToken,
      message: `${config.name} account connected successfully!`,
    };
  } catch (error) {
    logger.error('Error completing login:', error);

    // Clean up
    try {
      await browser.close();
    } catch {}
    activeSessions.delete(sessionKey);

    throw error;
  }
}

/**
 * Close/cancel a login session
 */
export async function closeLoginSession(userId, platform) {
  const sessionKey = `${userId}-${platform}`;
  const session = activeSessions.get(sessionKey);

  if (session) {
    try {
      await session.browser.close();
    } catch {}
    activeSessions.delete(sessionKey);
  }

  return { success: true };
}

/**
 * Get active sessions for a user
 */
export function getActiveSessions(userId) {
  const sessions = [];
  for (const [key, session] of activeSessions) {
    if (key.startsWith(userId)) {
      sessions.push({
        platform: session.platform,
        startedAt: session.startedAt,
      });
    }
  }
  return sessions;
}

export default {
  startLoginSession,
  checkLoginStatus,
  completeLogin,
  closeLoginSession,
  getActiveSessions,
};
