import { getBrowser, releaseBrowser } from '../../utils/browserPool.js';
import { takeScreenshot } from '../screenshot.service.js';
import config from '../../config/env.js';
import logger from '../../utils/logger.js';

const CHATGPT_URL = 'https://chatgpt.com';

// Selectors (updated for current ChatGPT UI - no Playwright-specific selectors)
const SELECTORS = {
  chatInput: '#prompt-textarea, textarea[data-id="root"], textarea[placeholder*="Message"], div[contenteditable="true"]',
  sendButton: 'button[data-testid="send-button"], button[aria-label="Send prompt"], button[data-testid="fruitjuice-send-button"]',
  responseContainer: '[data-message-author-role="assistant"], div.markdown, div[class*="markdown"]',
  newChatButton: 'a[href="/"], nav a[href="/"]',
};

// Helper to wait (replacement for deprecated waitForTimeout)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function scanChatGPT(prompt, sessionToken) {
  let browser = null;
  let page = null;

  try {
    // For demo/development without session token, return simulated response
    if (!sessionToken) {
      logger.warn('ChatGPT: No session token provided, returning simulated response');
      return generateSimulatedResponse(prompt);
    }

    browser = await getBrowser();
    page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent to look more like a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set session cookies for both domains
    await page.setCookie({
      name: '__Secure-next-auth.session-token',
      value: sessionToken,
      domain: '.chatgpt.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    });

    await page.setCookie({
      name: '__Secure-next-auth.session-token',
      value: sessionToken,
      domain: '.chat.openai.com',
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    });

    // Navigate to ChatGPT
    logger.info('ChatGPT: Navigating to page...');
    await page.goto(CHATGPT_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait a moment for page to fully render
    await wait(3000);

    // Check if we're on a login page by looking at page content
    const pageContent = await page.content();
    const currentUrl = page.url();

    if (currentUrl.includes('/auth/login') ||
        (pageContent.includes('Log in') && pageContent.includes('Sign up') && !pageContent.includes('prompt-textarea'))) {
      throw new Error('Session expired - please re-authenticate with ChatGPT');
    }

    // Wait for chat input to be available
    logger.info('ChatGPT: Waiting for chat input...');
    await page.waitForSelector(SELECTORS.chatInput, { timeout: 30000 });

    // Clear any existing text and type the prompt
    const inputEl = await page.$(SELECTORS.chatInput);
    await inputEl.click();
    await wait(500);

    // Type the prompt
    logger.info('ChatGPT: Typing prompt...');
    await page.type(SELECTORS.chatInput, prompt, { delay: 30 });

    await wait(1000);

    // Click send button or press Enter
    logger.info('ChatGPT: Sending prompt...');
    const sendButton = await page.$(SELECTORS.sendButton);
    if (sendButton) {
      await sendButton.click();
    } else {
      await page.keyboard.press('Enter');
    }

    // Wait for response to complete
    logger.info('ChatGPT: Waiting for response...');
    let responseText = '';
    let lastText = '';
    let unchangedCount = 0;
    const maxWait = config.promptTimeout || 120000;
    const startTime = Date.now();

    // Wait for response container to appear
    await wait(3000);

    while (Date.now() - startTime < maxWait) {
      await wait(2000);

      // Get the last assistant message
      const messages = await page.$$(SELECTORS.responseContainer);
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        responseText = await lastMessage.evaluate(el => el.innerText);

        // Check if response is still changing
        if (responseText === lastText && responseText.length > 50) {
          unchangedCount++;
          if (unchangedCount >= 3) {
            // Response hasn't changed for 6 seconds, likely complete
            logger.info('ChatGPT: Response complete (no changes detected)');
            break;
          }
        } else {
          unchangedCount = 0;
          lastText = responseText;
        }
      }

      // Check if still generating by looking for streaming indicators
      const isGenerating = await page.evaluate(() => {
        const streamingDots = document.querySelector('[class*="result-streaming"]');
        const loadingCursor = document.querySelector('[class*="cursor"]');
        const stopButton = document.querySelector('button[aria-label*="Stop"]');
        return !!(streamingDots || loadingCursor || stopButton);
      });

      if (!isGenerating && responseText.length > 50) {
        await wait(2000);
        break;
      }
    }

    // Take screenshot
    logger.info('ChatGPT: Taking screenshot...');
    const screenshotPath = await takeScreenshot(page, `chatgpt_${Date.now()}`);

    logger.info(`ChatGPT: Scan complete, response length: ${responseText.length}`);

    return {
      responseText: responseText || 'No response received',
      screenshotPath,
    };
  } catch (error) {
    logger.error('ChatGPT scan error:', error);

    // Try to take error screenshot
    if (page) {
      try {
        await takeScreenshot(page, `chatgpt_error_${Date.now()}`);
      } catch {}
    }

    throw error;
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
    if (browser) {
      await releaseBrowser(browser);
    }
  }
}

// Simulated response for development/demo when no session token is available
function generateSimulatedResponse(prompt) {
  const promptLower = prompt.toLowerCase();
  let response = '';

  if (promptLower.includes('best') || promptLower.includes('top')) {
    response = `Based on my research, there are several highly-regarded options in this category. Here are some top recommendations:

1. **Industry Leader Co.** - Consistently rated highly for quality and service. They have excellent reviews and a strong track record.

2. **Premier Solutions** - Known for competitive pricing and reliable service. Many customers praise their responsiveness.

3. **Quality First Inc.** - Offers comprehensive services with good customer support. They specialize in custom solutions.

When choosing a provider, consider:
- Reviews and testimonials from past customers
- Years of experience in the industry
- Range of services offered
- Pricing transparency
- Certifications and qualifications

I'd recommend getting quotes from multiple providers and checking recent reviews before making a decision.`;
  } else if (promptLower.includes('recommend') || promptLower.includes('suggest')) {
    response = `I can offer some guidance on finding the right provider for your needs.

**Key Factors to Consider:**
- **Reputation**: Look for providers with consistently positive reviews
- **Experience**: Companies with 5+ years in the industry tend to be more reliable
- **Transparency**: Good providers offer clear pricing and detailed proposals
- **Communication**: Responsive customer service is essential

**Recommended Steps:**
1. Research local options and read reviews
2. Check credentials and certifications
3. Request quotes from at least 3 providers
4. Ask for references from recent projects
5. Compare not just price, but value and service quality

Would you like more specific recommendations based on your location or particular requirements?`;
  } else {
    response = `This is an area where careful research is important. Here are some general guidelines:

**What to Look For:**
- Strong online reviews across multiple platforms
- Proper licensing and insurance
- Transparent pricing with no hidden fees
- Good communication and responsiveness
- Portfolio of past work or client testimonials

**Red Flags to Avoid:**
- No verifiable reviews or references
- Prices significantly below market rate
- Reluctance to provide written quotes
- Poor communication during the inquiry phase

I'd suggest starting with a Google search for providers in your area, reading recent reviews, and reaching out to several options for consultations. This will give you a good sense of the market and help you make an informed decision.`;
  }

  return {
    responseText: response,
    screenshotPath: null,
  };
}

export default scanChatGPT;
