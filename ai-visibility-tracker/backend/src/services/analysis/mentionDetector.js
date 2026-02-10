/**
 * Mention Detection Service
 * Analyzes AI responses to determine if and how a brand is mentioned
 */

// Keywords that indicate a featured/primary recommendation
const FEATURED_INDICATORS = [
  'top choice',
  'top pick',
  'highly recommend',
  'strongly recommend',
  'best option',
  'leading',
  'stands out',
  'our recommendation',
  'first choice',
  '#1',
  'number one',
  'excellent choice',
  'top-rated',
  'highest rated',
  'most recommended',
];

// Patterns that indicate ranking position
const POSITION_PATTERNS = [
  /^1[\.\)]/m,                    // "1." or "1)"
  /^\*\*1[\.\)]/m,                // "**1."
  /first\s+(?:choice|option|recommendation)/i,
  /top\s+(?:of|on)\s+(?:the|our)\s+list/i,
];

/**
 * Detect brand mentions in an AI response
 * @param {string} responseText - The full AI response text
 * @param {string} brandName - The client's brand name
 * @param {string} domain - The client's domain (optional)
 * @returns {Object} Detection result
 */
export function detectMention(responseText, brandName, domain) {
  if (!responseText || !brandName) {
    return { type: 'NOT_FOUND', position: null, mentions: 0, context: [] };
  }

  const textLower = responseText.toLowerCase();
  const brandLower = brandName.toLowerCase();

  // Generate brand variations to search for
  const brandVariations = generateBrandVariations(brandName, domain);

  // Find all mentions
  const mentions = [];
  for (const variation of brandVariations) {
    const regex = new RegExp(escapeRegex(variation), 'gi');
    let match;
    while ((match = regex.exec(textLower)) !== null) {
      mentions.push({
        text: match[0],
        index: match.index,
        context: extractContext(responseText, match.index),
      });
    }
  }

  if (mentions.length === 0) {
    return { type: 'NOT_FOUND', position: null, mentions: 0, context: [] };
  }

  // Determine if featured
  const isFeatured = checkIfFeatured(responseText, mentions, brandLower);

  // Extract position
  const position = extractPosition(responseText, mentions, brandLower);

  if (isFeatured) {
    return {
      type: 'FEATURED',
      position: position || 1,
      mentions: mentions.length,
      context: mentions.map(m => m.context),
    };
  }

  return {
    type: 'MENTIONED',
    position,
    mentions: mentions.length,
    context: mentions.map(m => m.context),
  };
}

/**
 * Generate variations of the brand name to search for
 */
function generateBrandVariations(brandName, domain) {
  const variations = new Set();

  // Original name
  variations.add(brandName.toLowerCase());

  // Without common suffixes
  const suffixes = [' inc', ' llc', ' corp', ' co', ' ltd', ' group', ' services', ' company'];
  for (const suffix of suffixes) {
    if (brandName.toLowerCase().endsWith(suffix)) {
      variations.add(brandName.toLowerCase().slice(0, -suffix.length).trim());
    }
  }

  // Domain without TLD
  if (domain) {
    const domainLower = domain.toLowerCase();
    variations.add(domainLower);
    // Remove common TLDs
    const tlds = ['.com', '.net', '.org', '.io', '.co'];
    for (const tld of tlds) {
      if (domainLower.endsWith(tld)) {
        variations.add(domainLower.slice(0, -tld.length));
      }
    }
  }

  // Split compound names
  const words = brandName.split(/\s+/);
  if (words.length > 1) {
    // First word if it's unique enough (more than 4 chars)
    if (words[0].length > 4) {
      variations.add(words[0].toLowerCase());
    }
  }

  return Array.from(variations);
}

/**
 * Check if the brand is featured (primary recommendation)
 */
function checkIfFeatured(responseText, mentions, brandLower) {
  const textLower = responseText.toLowerCase();

  // Check if brand appears with featured indicators
  for (const indicator of FEATURED_INDICATORS) {
    const indicatorIndex = textLower.indexOf(indicator);
    if (indicatorIndex !== -1) {
      // Check if brand is near this indicator (within 200 chars)
      for (const mention of mentions) {
        const distance = Math.abs(mention.index - indicatorIndex);
        if (distance < 200) {
          return true;
        }
      }
    }
  }

  // Check if brand appears in position 1
  for (const pattern of POSITION_PATTERNS) {
    const match = pattern.exec(responseText);
    if (match) {
      // Check if brand appears shortly after position indicator
      const startIndex = match.index;
      const endIndex = startIndex + 300;
      const section = responseText.substring(startIndex, endIndex).toLowerCase();
      if (section.includes(brandLower)) {
        return true;
      }
    }
  }

  // Check if brand appears in first paragraph/section
  const firstSection = responseText.substring(0, 500).toLowerCase();
  if (firstSection.includes(brandLower)) {
    // Check if it's highlighted (bold/emphasized)
    const boldPattern = new RegExp(`\\*\\*[^*]*${escapeRegex(brandLower)}[^*]*\\*\\*`, 'i');
    if (boldPattern.test(responseText.substring(0, 500))) {
      return true;
    }
  }

  return false;
}

/**
 * Extract the position/ranking of the brand
 */
function extractPosition(responseText, mentions, brandLower) {
  // Look for numbered lists
  const listItemPattern = /^(\d+)[\.\)]\s*\*?\*?([^\n]+)/gm;
  let match;
  let position = null;

  while ((match = listItemPattern.exec(responseText)) !== null) {
    const itemNumber = parseInt(match[1], 10);
    const itemText = match[2].toLowerCase();

    if (itemText.includes(brandLower)) {
      position = itemNumber;
      break;
    }
  }

  return position;
}

/**
 * Extract context around a mention
 */
function extractContext(text, index, windowSize = 100) {
  const start = Math.max(0, index - windowSize);
  const end = Math.min(text.length, index + windowSize);
  return text.substring(start, end).trim();
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default detectMention;
