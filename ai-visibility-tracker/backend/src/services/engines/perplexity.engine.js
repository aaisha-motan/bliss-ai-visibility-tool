import fs from 'fs';
import path from 'path';
import config from '../../config/env.js';
import logger from '../../utils/logger.js';

const PERPLEXITY_SEARCH_URL = 'https://www.perplexity.ai/search';

// Ensure screenshot directory exists
const screenshotDir = config.screenshotDir || './screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

/**
 * Scan Perplexity using Firecrawl API (handles Cloudflare better)
 */
export async function scanPerplexity(prompt, sessionToken, firecrawlApiKey) {
  const apiKey = firecrawlApiKey || config.firecrawlApiKey;

  if (apiKey) {
    return scanWithFirecrawl(prompt, apiKey);
  } else {
    logger.warn('Perplexity: No Firecrawl API key configured');
    return {
      responseText: 'Perplexity scanning requires Firecrawl API due to Cloudflare protection. Please add your Firecrawl API key in Settings.',
      screenshotPath: null,
    };
  }
}

/**
 * Use Firecrawl API to scrape Perplexity
 */
async function scanWithFirecrawl(prompt, apiKey) {
  try {
    logger.info('Perplexity: Using Firecrawl API...');

    const encodedPrompt = encodeURIComponent(prompt);
    const searchUrl = `${PERPLEXITY_SEARCH_URL}?q=${encodedPrompt}`;

    logger.info(`Perplexity: Scraping URL: ${searchUrl}`);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown', 'screenshot'],
        waitFor: 15000,
        timeout: 60000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Firecrawl failed: ${data.error || 'Unknown error'}`);
    }

    let responseText = data.data?.markdown || '';
    logger.info(`Perplexity: Got markdown content, length: ${responseText.length}`);

    // Clean and extract the answer
    responseText = extractPerplexityAnswer(responseText);

    // Handle screenshot
    let screenshotPath = null;
    const screenshotData = data.data?.screenshot;

    if (screenshotData) {
      try {
        const filename = `perplexity_${Date.now()}.png`;
        const filepath = path.join(screenshotDir, filename);

        // Check if it's a base64 data URL or a regular URL
        if (screenshotData.startsWith('data:image')) {
          // Extract base64 data from data URL
          const base64Data = screenshotData.replace(/^data:image\/\w+;base64,/, '');
          fs.writeFileSync(filepath, Buffer.from(base64Data, 'base64'));
          screenshotPath = filename;
          logger.info(`Perplexity: Screenshot saved: ${filename}`);
        } else if (screenshotData.startsWith('http')) {
          // Download from URL
          const imgResponse = await fetch(screenshotData);
          if (imgResponse.ok) {
            const buffer = Buffer.from(await imgResponse.arrayBuffer());
            fs.writeFileSync(filepath, buffer);
            screenshotPath = filename;
            logger.info(`Perplexity: Screenshot downloaded and saved: ${filename}`);
          }
        }
      } catch (screenshotError) {
        logger.error('Perplexity: Failed to save screenshot:', screenshotError);
      }
    }

    return {
      responseText: responseText || 'No response content extracted from Perplexity',
      screenshotPath,
    };
  } catch (error) {
    logger.error('Perplexity Firecrawl error:', error);
    throw error;
  }
}

/**
 * Extract just the answer from Perplexity markdown response
 */
function extractPerplexityAnswer(markdown) {
  if (!markdown) return '';

  let text = markdown;

  // Step 1: Remove everything before the actual answer
  // The answer usually starts after "Answer" or after the query heading
  const answerMarkers = [
    /^[\s\S]*?(?=Here are|Here is|Based on|According to|The following|Several|There are|I found)/i,
    /^[\s\S]*?# .+?\n\n/,  // Remove title heading and content before
  ];

  // Try to find where the actual answer starts
  const answerStartPatterns = [
    /(?:^|\n)(Here are several|Here are some|Based on|According to|The following|I found|There are several)/i,
    /(?:^|\n)([A-Z][^#\n]{20,})/,  // Sentence starting with capital letter
  ];

  for (const pattern of answerStartPatterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      // Keep from this point
      const startIdx = match.index;
      if (startIdx > 0 && startIdx < text.length / 2) {
        text = text.substring(startIdx).trim();
        break;
      }
    }
  }

  // Step 2: Remove UI elements and navigation
  const removePatterns = [
    // Navigation and header elements
    /^\[?History\]?.*$/gim,
    /^\[?Library\]?.*$/gim,
    /^\[?More\]?.*$/gim,
    /^\[?Share\]?.*$/gim,
    /^Answer$/gim,
    /^Links$/gim,
    /^Images$/gim,
    /^Places$/gim,
    /^\[Mapbox.*?\].*$/gim,
    /^Mapbox homepage.*$/gim,

    // Map/Places data
    /^[A-Za-z\s]+(Studios?|Media|Marketing|Productions?|HQ)\n[\d.]+\n.*$/gim,
    /^\d+\.\d+\n\(\d+\)\n(Open|Closed)$/gim,
    /^!\[.*?\]\(https:\/\/st\.perplexity\.ai.*?\)$/gim,  // Perplexity images
    /^\d{3,5}\s+[A-Za-z]+.*?,\s*[A-Z]{2}\s+\d{5}$/gim,  // Addresses

    // Footer elements
    /^Follow-ups?$/gim,
    /^Ask a follow-up$/gim,
    /^Model$/gim,
    /^Sign in or create an account$/gim,
    /^Save and sync your searches$/gim,
    /^Continue with Google$/gim,
    /^Continue with Apple$/gim,
    /^Continue with email$/gim,
    /^Single sign-on.*$/gim,

    // Source references like [thinkbrandedmedia+1]
    /\[[\w+.-]+\+?\d*\]/g,

    // Rating stars/numbers alone on lines
    /^[\d.]+$/gm,
    /^\(\d+\)$/gm,
    /^(Open|Closed)$/gim,

    // See more links
    /^See more.*$/gim,

    // Empty markdown links
    /\[\]\([^)]+\)/g,

    // Perplexity branding
    /^perplexity.*$/gim,
  ];

  for (const pattern of removePatterns) {
    text = text.replace(pattern, '');
  }

  // Step 3: Clean up markdown formatting for plain text display
  // Convert markdown links to just text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Convert bold/italic to plain text (keep the content)
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Convert headers to plain text
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');

  // Step 4: Clean up list formatting
  text = text.replace(/^[-*]\s+/gm, '• ');

  // Step 5: Remove excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/^\s+|\s+$/gm, '');  // Trim each line

  // Remove empty lines at start/end
  text = text.trim();

  // Step 6: Ensure proper paragraph breaks
  const lines = text.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    // Remove very short lines that are likely UI elements
    if (trimmed.length < 3) return false;
    // Remove lines that are just numbers or ratings
    if (/^[\d.()]+$/.test(trimmed)) return false;
    // Remove lines that look like navigation
    if (/^(Home|Library|History|Settings|Profile|Menu|Search)$/i.test(trimmed)) return false;
    return true;
  });

  return cleanedLines.join('\n').trim();
}

export default scanPerplexity;
