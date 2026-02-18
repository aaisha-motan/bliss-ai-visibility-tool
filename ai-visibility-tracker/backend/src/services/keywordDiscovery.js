/**
 * Keyword Discovery Service
 * Discovers what keywords/prompts a client is already ranking for in AI platforms
 *
 * NEW FILE - Added February 17, 2026
 * Purpose: Address Rich's request "How do we find keywords that we're ranking well for?"
 */

import { config } from '../config/env.js';
import logger from '../utils/logger.js';
import { getDecryptedSettings } from '../controllers/settings.controller.js';
import { scanChatGPT } from './engines/chatgpt.engine.js';
import { scanPerplexity } from './engines/perplexity.engine.js';
import { scanGoogle } from './engines/google.engine.js';
import { detectMention } from './analysis/mentionDetector.js';

// Random delay helper
function randomDelay(min = 2000, max = 4000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Universal discovery prompt templates that work for any industry
 */
const DISCOVERY_TEMPLATES = [
  // Best/Top queries
  'Best {industry} companies in {location}',
  'Top {industry} services in {location}',
  'Best {industry} providers near me',
  'Top rated {industry} in {location}',

  // Recommendation queries
  'Who are the leading {industry} companies',
  'Recommended {industry} providers in {location}',
  'Most trusted {industry} services',
  'Who should I hire for {service} in {location}',

  // Review queries
  '{industry} companies with best reviews in {location}',
  'Highest rated {industry} in {location}',
  '{industry} reviews {location}',

  // Comparison queries
  'Compare {industry} providers in {location}',
  '{industry} companies comparison',
  'Best {industry} alternatives',

  // How to find queries
  'How to find a good {industry} company',
  'How to choose the best {industry} provider in {location}',
  'What to look for in a {industry} service',

  // Cost queries
  '{industry} services cost in {location}',
  'Affordable {industry} in {location}',
  'Best value {industry} providers',

  // Service-specific queries
  'Best {service} services in {location}',
  'Top {service} providers near me',
  '{service} specialists in {location}',
  'Professional {service} companies',

  // Local queries
  '{industry} near me',
  'Local {industry} companies',
  '{industry} in my area',
  '{location} {industry} recommendations',
];

/**
 * Generate discovery prompts using ChatGPT browser, OpenAI API, or templates
 * Priority: ChatGPT Browser > OpenAI API > Templates
 */
async function generateDiscoveryPrompts(options, settings = null) {
  const {
    industry,
    services = [],
    location,
    count = 20,
  } = options;

  // Priority 1: Try ChatGPT via browser (uses same session token as scanning)
  if (settings?.chatgptSessionToken) {
    try {
      logger.info('Generating prompts using ChatGPT browser (live)...');
      return await generateWithChatGPTBrowser(options, settings.chatgptSessionToken);
    } catch (error) {
      logger.warn(`ChatGPT browser prompt generation failed: ${error.message}`);
    }
  }

  // Priority 2: Try OpenAI API if available
  if (config.openaiApiKey) {
    try {
      logger.info('Generating prompts using OpenAI API...');
      return await generateWithOpenAI(options);
    } catch (error) {
      logger.warn(`OpenAI prompt generation failed: ${error.message}`);
    }
  }

  // Priority 3: Fallback to templates
  logger.info('Generating prompts using templates (fallback)...');
  return generateWithTemplates(options);
}

/**
 * Generate discovery prompts using ChatGPT via headless browser
 * This uses the same session token as scanning - no API key needed!
 */
async function generateWithChatGPTBrowser(options, sessionToken) {
  const { industry, services, location, count } = options;

  const chatGPTPrompt = `I need you to generate ${count} realistic search queries that people would type into AI assistants like ChatGPT or Perplexity when looking for ${industry} services${location ? ` in ${location}` : ''}.

${services.length > 0 ? `Focus on these services: ${services.join(', ')}` : ''}

Requirements:
- Natural, conversational questions people actually ask
- Include variations like "best", "top", "recommended", "who should I hire", "compare"
- Mix informational and transactional intent
- Include location-specific queries
- Cover: quality, cost, reviews, comparisons, recommendations

DO NOT include any brand names - these are generic discovery searches.

Return ONLY a JSON array of ${count} prompt strings, nothing else. Format:
["prompt 1", "prompt 2", ...]`;

  // Use the ChatGPT scan engine to get a response
  const result = await scanChatGPT(chatGPTPrompt, sessionToken);

  if (!result.responseText) {
    throw new Error('No response from ChatGPT');
  }

  // Parse the JSON array from the response
  let prompts;
  try {
    // Try to find JSON array in the response
    const jsonMatch = result.responseText.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      prompts = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON array found in response');
    }
  } catch (parseError) {
    // If JSON parsing fails, try to extract prompts line by line
    logger.warn('JSON parsing failed, extracting prompts manually');
    const lines = result.responseText.split('\n')
      .map(line => line.replace(/^[\d\.\-\*\s]+/, '').replace(/["']/g, '').trim())
      .filter(line => line.length > 10 && line.length < 200);
    prompts = lines.slice(0, count);
  }

  if (!Array.isArray(prompts) || prompts.length === 0) {
    throw new Error('Failed to extract prompts from ChatGPT response');
  }

  logger.info(`Generated ${prompts.length} prompts via ChatGPT browser`);
  return prompts.slice(0, count);
}

/**
 * Generate discovery prompts using OpenAI API (fallback)
 */
async function generateWithOpenAI(options) {
  const { industry, services, location, count } = options;

  const systemPrompt = `You are an AI visibility research assistant. Generate realistic search prompts that users would type into AI assistants (ChatGPT, Perplexity, Google) when looking for services in a specific industry.

The prompts should:
1. Be natural, conversational questions people actually ask
2. Include variations: "best", "top", "recommended", "who should I hire", "compare", etc.
3. Mix informational and transactional intent
4. Include location when relevant
5. Cover different aspects: quality, cost, reviews, comparisons

Do NOT include any brand names - these are discovery searches to find what queries return various companies.`;

  const userPrompt = `Generate ${count} unique discovery search prompts for the ${industry} industry${location ? ` in ${location}` : ''}.
${services.length > 0 ? `Key services: ${services.join(', ')}` : ''}

Return ONLY a JSON array of prompt strings. Example:
["Best solar companies in Los Angeles", "Top rated residential solar installers near me"]`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.9,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '[]';

  let prompts;
  try {
    prompts = JSON.parse(content);
  } catch {
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      prompts = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse OpenAI response');
    }
  }

  return prompts.slice(0, count);
}

/**
 * Generate discovery prompts using templates (fallback)
 */
function generateWithTemplates(options) {
  const { industry, services = [], location, count } = options;

  const prompts = [];
  const locationText = location || 'my area';
  const serviceList = services.length > 0 ? services : [industry];

  for (const template of DISCOVERY_TEMPLATES) {
    for (const service of serviceList) {
      if (prompts.length >= count * 2) break; // Generate extra, will dedupe

      const prompt = template
        .replace(/{industry}/g, industry)
        .replace(/{service}/g, service)
        .replace(/{location}/g, locationText)
        .trim();

      if (!prompts.includes(prompt)) {
        prompts.push(prompt);
      }
    }
  }

  // Shuffle and return requested count
  return prompts
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

/**
 * Run a quick discovery scan on a single prompt
 * Uses only one engine for speed (ChatGPT by default)
 * Now includes screenshot proof for verification!
 */
async function runQuickScan(prompt, settings, clientName, clientDomain, engine = 'chatgpt') {
  try {
    let result;

    switch (engine.toLowerCase()) {
      case 'chatgpt':
        result = await scanChatGPT(prompt, settings?.chatgptSessionToken);
        break;
      case 'perplexity':
        result = await scanPerplexity(prompt, settings?.perplexitySessionToken, settings?.firecrawlApiKey);
        break;
      case 'google':
        result = await scanGoogle(prompt, settings?.serpApiKey);
        break;
      default:
        result = await scanChatGPT(prompt, settings?.chatgptSessionToken);
    }

    // Detect if client is mentioned
    const mention = detectMention(result.responseText, clientName, clientDomain);

    return {
      prompt,
      engine: engine.toUpperCase(),
      mentionType: mention.type,
      rankingPosition: mention.position,
      responsePreview: result.responseText?.substring(0, 300) + '...',
      fullResponse: result.responseText,
      screenshotPath: result.screenshotPath || null, // Screenshot proof!
      success: true,
    };
  } catch (error) {
    logger.error(`Quick scan failed for "${prompt}": ${error.message}`);
    return {
      prompt,
      engine: engine.toUpperCase(),
      mentionType: 'ERROR',
      rankingPosition: null,
      responsePreview: error.message,
      fullResponse: null,
      screenshotPath: null,
      success: false,
    };
  }
}

/**
 * Main discovery function - discovers keywords where client is ranking
 * @param {Object} options Discovery options
 * @param {string} options.clientId - Client ID
 * @param {string} options.userId - User ID (for settings)
 * @param {string} options.industry - Industry/niche
 * @param {string[]} options.services - Primary services
 * @param {string} options.location - Target location
 * @param {string} options.depth - Discovery depth: 'quick' (10), 'standard' (25), 'thorough' (50)
 * @param {string} options.engine - Engine to use: 'chatgpt', 'perplexity', 'google', 'all'
 * @param {function} options.onProgress - Progress callback
 * @returns {Promise<Object>} Discovery results
 */
export async function discoverKeywords(options) {
  const {
    clientId,
    clientName,
    clientDomain,
    userId,
    industry,
    services = [],
    location = '',
    depth = 'standard',
    engine = 'chatgpt',
    onProgress = () => {},
  } = options;

  logger.info(`Starting keyword discovery for "${clientName}" in ${industry} industry`);

  // Determine prompt count based on depth
  const countMap = { quick: 10, standard: 25, thorough: 50 };
  const promptCount = countMap[depth] || 25;

  await onProgress(5, 'Getting settings and preparing...');

  // Get user settings FIRST (needed for ChatGPT browser prompt generation)
  const settings = await getDecryptedSettings(userId);

  await onProgress(8, 'Generating discovery prompts using ChatGPT...');

  // Generate discovery prompts (now uses ChatGPT browser if available!)
  const prompts = await generateDiscoveryPrompts({
    industry,
    services,
    location,
    count: promptCount,
  }, settings); // Pass settings so it can use ChatGPT session token

  logger.info(`Generated ${prompts.length} discovery prompts`);
  await onProgress(15, `Generated ${prompts.length} prompts, starting scans...`);

  // Run scans on each prompt
  const results = [];
  const discovered = {
    featured: [],
    mentioned: [],
    notFound: [],
    errors: [],
  };

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const progress = 15 + Math.round((i / prompts.length) * 80);

    await onProgress(progress, `Scanning prompt ${i + 1}/${prompts.length}...`);

    // Run quick scan
    const result = await runQuickScan(prompt, settings, clientName, clientDomain, engine);
    results.push(result);

    // Categorize result with screenshot proof
    if (result.success) {
      if (result.mentionType === 'FEATURED') {
        discovered.featured.push({
          prompt: result.prompt,
          mentionType: result.mentionType,
          position: result.rankingPosition,
          engine: result.engine,
          screenshotPath: result.screenshotPath, // Proof!
          responsePreview: result.responsePreview,
        });
      } else if (result.mentionType === 'MENTIONED') {
        discovered.mentioned.push({
          prompt: result.prompt,
          mentionType: result.mentionType,
          position: result.rankingPosition,
          engine: result.engine,
          screenshotPath: result.screenshotPath, // Proof!
          responsePreview: result.responsePreview,
        });
      } else {
        discovered.notFound.push({
          prompt: result.prompt,
          engine: result.engine,
          screenshotPath: result.screenshotPath,
        });
      }
    } else {
      discovered.errors.push({
        prompt: result.prompt,
        error: result.responsePreview,
      });
    }

    // Add delay between scans
    if (i < prompts.length - 1) {
      await randomDelay(2000, 4000);
    }
  }

  await onProgress(95, 'Analyzing results...');

  // Calculate statistics
  const totalScanned = results.length;
  const successfulScans = results.filter(r => r.success).length;
  const featuredCount = discovered.featured.length;
  const mentionedCount = discovered.mentioned.length;
  const visibilityRate = successfulScans > 0
    ? Math.round(((featuredCount + mentionedCount) / successfulScans) * 100)
    : 0;

  await onProgress(100, 'Discovery complete!');

  logger.info(`Discovery complete: ${featuredCount} featured, ${mentionedCount} mentioned out of ${totalScanned} prompts`);

  return {
    summary: {
      totalScanned,
      successfulScans,
      featuredCount,
      mentionedCount,
      notFoundCount: discovered.notFound.length,
      errorCount: discovered.errors.length,
      visibilityRate: `${visibilityRate}%`,
    },
    discovered: {
      featured: discovered.featured,
      mentioned: discovered.mentioned,
    },
    notFound: discovered.notFound,
    errors: discovered.errors,
    allPrompts: prompts,
    settings: {
      industry,
      services,
      location,
      depth,
      engine,
    },
  };
}

export default {
  discoverKeywords,
  generateDiscoveryPrompts,
};
