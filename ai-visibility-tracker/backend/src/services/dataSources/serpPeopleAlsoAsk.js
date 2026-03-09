/**
 * SERP API People Also Ask Data Source
 * Fetches "People Also Ask" questions and related searches from Google via SERP API
 *
 * Uses existing SERP API key - 1 credit per query
 */

import logger from '../../utils/logger.js';

const SERP_API_URL = 'https://serpapi.com/search.json';

/**
 * Get People Also Ask questions and related searches for a keyword
 * @param {string} keyword - Seed keyword to search for
 * @param {string} serpApiKey - SERP API key
 * @param {string} location - Location string (e.g., 'Los Angeles, CA')
 * @returns {Promise<{paaQuestions: string[], relatedSearches: string[]}>}
 */
export async function getPeopleAlsoAsk(keyword, serpApiKey, location = '') {
  if (!serpApiKey) {
    logger.warn('SERP PAA: No API key provided, skipping');
    return { paaQuestions: [], relatedSearches: [] };
  }

  try {
    logger.info(`SERP PAA: Fetching PAA for "${keyword}"`);

    const params = new URLSearchParams({
      api_key: serpApiKey,
      q: keyword,
      engine: 'google',
      gl: 'us',
      hl: 'en',
    });

    if (location) {
      params.set('location', location);
    }

    const response = await fetch(`${SERP_API_URL}?${params}`);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid SERP API key');
      }
      if (response.status === 429) {
        throw new Error('SERP API rate limit exceeded');
      }
      throw new Error(`SERP API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract People Also Ask questions
    const paaQuestions = [];
    if (Array.isArray(data.related_questions)) {
      for (const item of data.related_questions) {
        if (item.question) {
          paaQuestions.push(item.question);
        }
      }
    }

    // Extract Related Searches
    const relatedSearches = [];
    if (Array.isArray(data.related_searches)) {
      for (const item of data.related_searches) {
        if (item.query) {
          relatedSearches.push(item.query);
        }
      }
    }

    logger.info(`SERP PAA: Found ${paaQuestions.length} PAA questions and ${relatedSearches.length} related searches for "${keyword}"`);

    return { paaQuestions, relatedSearches };
  } catch (error) {
    logger.warn(`SERP PAA error for "${keyword}": ${error.message}`);
    return { paaQuestions: [], relatedSearches: [] };
  }
}

export default { getPeopleAlsoAsk };
