/**
 * Prompt Enricher
 * Orchestrates Google Trends and SERP PAA data sources to enrich discovery prompts
 *
 * Inserted between prompt generation and scanning in the keyword discovery flow
 */

import { getRelatedQueries } from './googleTrends.js';
import { getPeopleAlsoAsk } from './serpPeopleAlsoAsk.js';
import logger from '../../utils/logger.js';

/**
 * Enrich base prompts with real-world data from Google Trends and SERP PAA
 *
 * @param {string[]} basePrompts - Already-generated prompts from templates/OpenAI
 * @param {Object} options
 * @param {string} options.industry - Industry/niche
 * @param {string} options.location - Target location
 * @param {string[]} options.services - Service keywords
 * @param {boolean} options.useTrends - Whether to fetch Google Trends data
 * @param {boolean} options.usePAA - Whether to fetch SERP PAA data
 * @param {string} options.serpApiKey - SERP API key (needed for PAA)
 * @returns {Promise<{allPrompts: Array<{text: string, source: string}>, sources: {trends: string[], paa: string[]}}>}
 */
export async function enrichPrompts(basePrompts, options = {}) {
  const {
    industry = '',
    location = '',
    services = [],
    useTrends = false,
    usePAA = false,
    serpApiKey = '',
  } = options;

  // Tag base prompts with their source
  const taggedPrompts = basePrompts.map(text => ({ text, source: 'template' }));

  // Build seed keywords from industry + services
  const seeds = [];
  if (industry) seeds.push(industry);
  for (const service of services) {
    if (service && !seeds.includes(service)) {
      seeds.push(service);
    }
  }

  // If no enrichment requested or no seeds, return base prompts as-is
  if ((!useTrends && !usePAA) || seeds.length === 0) {
    return {
      allPrompts: taggedPrompts,
      sources: { trends: [], paa: [] },
    };
  }

  logger.info(`Enriching prompts with${useTrends ? ' Trends' : ''}${usePAA ? ' PAA' : ''} using seeds: ${seeds.join(', ')}`);

  const trendResults = [];
  const paaResults = [];

  // Collect from both sources in parallel per seed
  for (const seed of seeds) {
    const promises = [];

    if (useTrends) {
      promises.push(
        getRelatedQueries(seed, 'US').then(queries => {
          trendResults.push(...queries);
        })
      );
    }

    if (usePAA && serpApiKey) {
      promises.push(
        getPeopleAlsoAsk(seed, serpApiKey, location).then(({ paaQuestions, relatedSearches }) => {
          paaResults.push(...paaQuestions, ...relatedSearches);
        })
      );
    }

    await Promise.all(promises);
  }

  // Deduplicate enrichment results against base prompts
  const existingLower = new Set(basePrompts.map(p => p.toLowerCase().trim()));

  const addedTrends = [];
  for (const query of [...new Set(trendResults)]) {
    const lower = query.toLowerCase().trim();
    if (lower.length > 5 && !existingLower.has(lower)) {
      taggedPrompts.push({ text: query, source: 'trends' });
      existingLower.add(lower);
      addedTrends.push(query);
    }
  }

  const addedPAA = [];
  for (const query of [...new Set(paaResults)]) {
    const lower = query.toLowerCase().trim();
    if (lower.length > 5 && !existingLower.has(lower)) {
      taggedPrompts.push({ text: query, source: 'paa' });
      existingLower.add(lower);
      addedPAA.push(query);
    }
  }

  logger.info(`Enrichment added ${addedTrends.length} from Trends, ${addedPAA.length} from PAA`);

  return {
    allPrompts: taggedPrompts,
    sources: {
      trends: addedTrends,
      paa: addedPAA,
    },
  };
}

export default { enrichPrompts };
