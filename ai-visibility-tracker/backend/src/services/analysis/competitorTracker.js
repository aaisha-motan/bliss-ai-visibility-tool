/**
 * Competitor Tracking Service
 * Identifies known and new competitors mentioned in AI responses
 */

// Common business suffixes that might indicate a company name
const BUSINESS_SUFFIXES = [
  'inc',
  'llc',
  'corp',
  'co',
  'ltd',
  'group',
  'services',
  'company',
  'solutions',
  'enterprises',
  'partners',
  'agency',
  'associates',
  'consulting',
];

// Words that typically precede business names in recommendations
const BUSINESS_PREFIXES = [
  'try',
  'consider',
  'recommend',
  'check out',
  'look at',
  'contact',
  'visit',
  'call',
];

/**
 * Track competitor mentions in an AI response
 * @param {string} responseText - The full AI response text
 * @param {string[]} knownCompetitors - List of known competitor names
 * @returns {Object} Tracking result
 */
export function trackCompetitors(responseText, knownCompetitors = []) {
  if (!responseText) {
    return { mentioned: [], newCompetitors: [], positions: {} };
  }

  const textLower = responseText.toLowerCase();
  const mentioned = [];
  const positions = {};

  // Check for known competitors
  for (const competitor of knownCompetitors) {
    if (!competitor) continue;

    const competitorLower = competitor.toLowerCase();
    const variations = generateCompetitorVariations(competitor);

    for (const variation of variations) {
      if (textLower.includes(variation.toLowerCase())) {
        if (!mentioned.includes(competitor)) {
          mentioned.push(competitor);

          // Try to extract position
          const position = extractCompetitorPosition(responseText, variation);
          if (position) {
            positions[competitor] = position;
          }
        }
        break;
      }
    }
  }

  // Detect potential new competitors
  const newCompetitors = detectNewCompetitors(responseText, knownCompetitors);

  return {
    mentioned,
    newCompetitors,
    positions,
  };
}

/**
 * Generate variations of a competitor name
 */
function generateCompetitorVariations(name) {
  const variations = new Set();
  variations.add(name);

  // Without common suffixes
  for (const suffix of BUSINESS_SUFFIXES) {
    const suffixPattern = new RegExp(`\\s+${suffix}\\.?$`, 'i');
    if (suffixPattern.test(name)) {
      variations.add(name.replace(suffixPattern, '').trim());
    }
  }

  // Hyphenated version
  variations.add(name.replace(/\s+/g, '-'));

  // No spaces version
  variations.add(name.replace(/\s+/g, ''));

  return Array.from(variations);
}

/**
 * Extract the position of a competitor in a list
 */
function extractCompetitorPosition(text, competitorName) {
  const textLower = text.toLowerCase();
  const competitorLower = competitorName.toLowerCase();

  // Look for numbered lists
  const listItemPattern = /^(\d+)[\.\)]\s*\*?\*?([^\n]+)/gm;
  let match;

  while ((match = listItemPattern.exec(text)) !== null) {
    const itemNumber = parseInt(match[1], 10);
    const itemText = match[2].toLowerCase();

    if (itemText.includes(competitorLower)) {
      return itemNumber;
    }
  }

  return null;
}

/**
 * Detect potential new competitors mentioned in the response
 */
function detectNewCompetitors(responseText, knownCompetitors) {
  const newCompetitors = [];
  const knownLower = knownCompetitors.map(c => c?.toLowerCase() || '');

  // Pattern 1: Bold text that looks like company names
  const boldPattern = /\*\*([A-Z][A-Za-z0-9\s&'-]+(?:Inc|LLC|Corp|Co|Ltd|Group|Services)?)\*\*/g;
  let match;

  while ((match = boldPattern.exec(responseText)) !== null) {
    const potentialName = match[1].trim();

    // Filter out common non-company bold text
    if (isLikelyCompanyName(potentialName) && !isKnownCompetitor(potentialName, knownLower)) {
      if (!newCompetitors.includes(potentialName)) {
        newCompetitors.push(potentialName);
      }
    }
  }

  // Pattern 2: Names followed by business suffixes
  for (const suffix of BUSINESS_SUFFIXES) {
    const pattern = new RegExp(`([A-Z][A-Za-z0-9\\s&'-]+)\\s+${suffix}\\b`, 'gi');

    while ((match = pattern.exec(responseText)) !== null) {
      const potentialName = `${match[1].trim()} ${suffix}`;

      if (isLikelyCompanyName(potentialName) && !isKnownCompetitor(potentialName, knownLower)) {
        if (!newCompetitors.includes(potentialName)) {
          newCompetitors.push(potentialName);
        }
      }
    }
  }

  // Pattern 3: Names with ratings (common in AI responses)
  const ratingPattern = /([A-Z][A-Za-z0-9\s&'-]+)\s*[⭐★]\s*[\d.]+/g;

  while ((match = ratingPattern.exec(responseText)) !== null) {
    const potentialName = match[1].trim();

    if (isLikelyCompanyName(potentialName) && !isKnownCompetitor(potentialName, knownLower)) {
      if (!newCompetitors.includes(potentialName)) {
        newCompetitors.push(potentialName);
      }
    }
  }

  // Limit to top 5 most likely new competitors
  return newCompetitors.slice(0, 5);
}

/**
 * Check if a string is likely a company name
 */
function isLikelyCompanyName(name) {
  if (!name || name.length < 3 || name.length > 50) {
    return false;
  }

  // Filter out common non-company words
  const nonCompanyWords = [
    'key factors',
    'top recommendations',
    'important considerations',
    'what to look for',
    'recommended steps',
    'sources',
    'overview',
    'summary',
    'conclusion',
    'introduction',
    'note',
    'warning',
    'tip',
    'example',
  ];

  const nameLower = name.toLowerCase();
  for (const word of nonCompanyWords) {
    if (nameLower.includes(word)) {
      return false;
    }
  }

  // Must start with a capital letter
  if (!/^[A-Z]/.test(name)) {
    return false;
  }

  // Should not be all caps (likely a heading)
  if (name === name.toUpperCase() && name.length > 5) {
    return false;
  }

  return true;
}

/**
 * Check if a name matches any known competitor
 */
function isKnownCompetitor(name, knownLower) {
  const nameLower = name.toLowerCase();

  for (const known of knownLower) {
    if (!known) continue;

    // Exact match
    if (nameLower === known) {
      return true;
    }

    // Partial match (one contains the other)
    if (nameLower.includes(known) || known.includes(nameLower)) {
      return true;
    }
  }

  return false;
}

export default trackCompetitors;
