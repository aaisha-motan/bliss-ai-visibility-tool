/**
 * Prompt Generator Service
 * Generates AI search prompts from keywords using ChatGPT browser, OpenAI API, or templates
 *
 * NEW FILE - Added February 12, 2026
 * Updated: February 18, 2026 - Added ChatGPT browser support (no API key needed!)
 * Purpose: Address Rich's request for auto-generating prompts from keywords
 */

import { config } from '../config/env.js';
import logger from '../utils/logger.js';
import { scanChatGPT } from './engines/chatgpt.engine.js';

/**
 * Generate search prompts from keywords
 * Priority: ChatGPT Browser > OpenAI API > Templates
 *
 * @param {Object} options - Generation options
 * @param {string} options.brandName - The client's brand name
 * @param {string} options.domain - The client's domain
 * @param {string[]} options.keywords - Focus keywords to generate prompts for
 * @param {string} options.industry - Industry/niche of the business
 * @param {string} options.location - Geographic location (optional)
 * @param {number} options.count - Number of prompts to generate (default 10)
 * @param {Object} settings - User settings with session tokens (optional)
 * @returns {Promise<Object>} Generated prompts and metadata
 */
export async function generatePrompts(options, settings = null) {
  const {
    brandName,
    domain,
    keywords = [],
    industry = '',
    location = '',
    count = 10,
  } = options;

  if (!keywords || keywords.length === 0) {
    throw new Error('At least one keyword is required');
  }

  logger.info(`Generating ${count} prompts for "${brandName}" with keywords: ${keywords.join(', ')}`);

  // Priority 1: Try ChatGPT via browser (uses same session token as scanning - no API key needed!)
  if (settings?.chatgptSessionToken) {
    try {
      logger.info('Generating prompts using ChatGPT browser (live)...');
      return await generateWithChatGPTBrowser(options, settings.chatgptSessionToken);
    } catch (error) {
      logger.warn(`ChatGPT browser generation failed: ${error.message}`);
    }
  }

  // Priority 2: Try OpenAI API if available
  if (config.openaiApiKey) {
    try {
      logger.info('Generating prompts using OpenAI API...');
      return await generateWithOpenAI(options);
    } catch (error) {
      logger.warn(`OpenAI generation failed, falling back to templates: ${error.message}`);
    }
  }

  // Priority 3: Fallback to template-based generation
  logger.info('Generating prompts using templates (fallback)...');
  return generateWithTemplates(options);
}

/**
 * Generate prompts using ChatGPT via headless browser
 * This uses the same session token as scanning - no API key needed!
 */
async function generateWithChatGPTBrowser(options, sessionToken) {
  const { keywords, industry, location, count } = options;

  const chatGPTPrompt = `I need you to generate ${count} realistic search queries that people would type into AI assistants like ChatGPT or Perplexity when looking for services related to: ${keywords.join(', ')}${industry ? ` in the ${industry} industry` : ''}${location ? ` in ${location}` : ''}.

Requirements:
- Natural, conversational questions people actually ask
- Include variations like "best", "top", "recommended", "who should I hire", "compare"
- Mix informational and transactional intent
- Include location-specific queries if location provided
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

  return {
    prompts: prompts.slice(0, count),
    source: 'chatgpt-browser',
    metadata: {
      method: 'ChatGPT Browser (live)',
      keywords,
      location,
      industry,
    },
  };
}

/**
 * Generate prompts using OpenAI API
 */
async function generateWithOpenAI(options) {
  const {
    brandName,
    domain,
    keywords,
    industry,
    location,
    count,
  } = options;

  const locationContext = location ? ` in ${location}` : '';
  const industryContext = industry ? ` (${industry} industry)` : '';

  const systemPrompt = `You are an AI visibility research assistant. Generate realistic search prompts that users would type into AI assistants like ChatGPT, Perplexity, or Google when looking for services or information related to the given keywords.

The prompts should:
1. Be natural, conversational questions people actually ask AI
2. Include variations: "best", "top", "recommended", "who should I hire", "how to find", etc.
3. Mix informational and transactional intent
4. Include location-specific queries if location is provided
5. Be relevant to the business industry

Do NOT mention the brand name in the prompts - these are discovery searches.`;

  const userPrompt = `Generate ${count} unique search prompts for a business with these details:
- Business: ${brandName}${industryContext}
- Domain: ${domain}
- Focus Keywords: ${keywords.join(', ')}
${location ? `- Location: ${location}` : ''}

Return ONLY a JSON array of prompt strings, no explanation. Example format:
["Best solar panel installers near me", "Who should I hire for residential solar installation"]`;

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
      temperature: 0.8,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '[]';

  // Parse the JSON response
  let prompts;
  try {
    prompts = JSON.parse(content);
  } catch {
    // Try to extract JSON from the response
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      prompts = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse OpenAI response');
    }
  }

  return {
    prompts: prompts.slice(0, count),
    source: 'openai',
    metadata: {
      model: 'gpt-4o-mini',
      keywords,
      location,
      industry,
    },
  };
}

/**
 * Generate prompts using templates (fallback when no AI API available)
 */
function generateWithTemplates(options) {
  const {
    keywords,
    industry,
    location,
    count,
  } = options;

  const templates = [
    // Best/Top queries
    'Best {keyword} services{location}',
    'Top rated {keyword} companies{location}',
    'Best {keyword} providers{location}',

    // Recommendation queries
    'Who should I hire for {keyword}{location}',
    'Recommended {keyword} services{location}',
    'Most trusted {keyword} companies{location}',

    // How to find queries
    'How to find a good {keyword} service{location}',
    'How to choose the best {keyword} company{location}',
    'What to look for in a {keyword} provider{location}',

    // Comparison queries
    'Best {keyword} vs alternatives{location}',
    '{keyword} services comparison{location}',
    'Top {keyword} companies ranked{location}',

    // Cost/pricing queries
    'How much does {keyword} cost{location}',
    'Affordable {keyword} services{location}',
    '{keyword} pricing guide{location}',

    // Review queries
    '{keyword} reviews{location}',
    'Best reviewed {keyword} services{location}',

    // Industry-specific
    '{industry} {keyword} specialists{location}',
    'Professional {keyword} for {industry}{location}',

    // Local queries
    '{keyword} near me',
    'Local {keyword} services{location}',
    '{keyword} in my area',
  ];

  const locationSuffix = location ? ` in ${location}` : '';
  const industryText = industry || 'business';

  const prompts = [];
  const usedTemplates = new Set();

  // Generate prompts by filling in templates with keywords
  for (const keyword of keywords) {
    for (const template of templates) {
      if (prompts.length >= count) break;

      const templateKey = `${template}-${keyword}`;
      if (usedTemplates.has(templateKey)) continue;

      const prompt = template
        .replace('{keyword}', keyword)
        .replace('{location}', locationSuffix)
        .replace('{industry}', industryText)
        .replace(/\s+/g, ' ')
        .trim();

      if (prompt && !prompts.includes(prompt)) {
        prompts.push(prompt);
        usedTemplates.add(templateKey);
      }
    }
  }

  // Shuffle the prompts to mix different query types
  const shuffled = prompts.sort(() => Math.random() - 0.5);

  return {
    prompts: shuffled.slice(0, count),
    source: 'templates',
    metadata: {
      keywords,
      location,
      industry,
      templatesUsed: Math.min(count, prompts.length),
    },
  };
}

/**
 * Validate and clean generated prompts
 */
export function validatePrompts(prompts, brandName) {
  return prompts
    .filter(prompt => {
      // Remove empty prompts
      if (!prompt || typeof prompt !== 'string') return false;

      // Remove prompts that are too short
      if (prompt.length < 10) return false;

      // Remove prompts that mention the brand (we want discovery searches)
      if (brandName && prompt.toLowerCase().includes(brandName.toLowerCase())) {
        return false;
      }

      return true;
    })
    .map(prompt => prompt.trim());
}

export default {
  generatePrompts,
  validatePrompts,
};
