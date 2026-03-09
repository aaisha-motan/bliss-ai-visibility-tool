/**
 * Google Trends Data Source
 * Fetches related queries from Google Trends for keyword enrichment
 *
 * Uses google-trends-api (unofficial, free, no API key needed)
 */

import googleTrends from 'google-trends-api';
import logger from '../../utils/logger.js';

/**
 * Get related queries from Google Trends for a keyword
 * @param {string} keyword - Seed keyword to find related queries for
 * @param {string} geo - Geographic location code (e.g., 'US', 'GB'). Default 'US'
 * @returns {Promise<string[]>} Array of related search query strings
 */
export async function getRelatedQueries(keyword, geo = 'US') {
  try {
    logger.info(`Google Trends: Fetching related queries for "${keyword}" (geo: ${geo})`);

    const result = await googleTrends.relatedQueries({
      keyword,
      geo,
    });

    const parsed = JSON.parse(result);

    const queries = [];

    // Extract "top" related queries
    const topQueries = parsed?.default?.rankedList?.[0]?.rankedKeyword;
    if (Array.isArray(topQueries)) {
      for (const item of topQueries) {
        if (item.query) {
          queries.push(item.query);
        }
      }
    }

    // Extract "rising" related queries
    const risingQueries = parsed?.default?.rankedList?.[1]?.rankedKeyword;
    if (Array.isArray(risingQueries)) {
      for (const item of risingQueries) {
        if (item.query) {
          queries.push(item.query);
        }
      }
    }

    // Deduplicate
    const unique = [...new Set(queries)];

    logger.info(`Google Trends: Found ${unique.length} related queries for "${keyword}"`);
    return unique;
  } catch (error) {
    logger.warn(`Google Trends error for "${keyword}": ${error.message}`);
    return [];
  }
}

export default { getRelatedQueries };
