/**
 * Sentiment Analysis Service
 * Analyzes the sentiment of AI responses regarding a brand
 */

// Positive sentiment words
const POSITIVE_WORDS = [
  'best', 'top', 'leading', 'excellent', 'outstanding', 'exceptional',
  'highly rated', 'highly recommended', 'trusted', 'reliable', 'reputable',
  'quality', 'professional', 'experienced', 'award-winning', 'certified',
  'innovative', 'efficient', 'responsive', 'friendly', 'helpful',
  'affordable', 'competitive', 'value', 'satisfaction', 'guaranteed',
  'positive', 'praised', 'acclaimed', 'recognized', 'renowned',
  'comprehensive', 'thorough', 'dedicated', 'committed', 'established',
  'premier', 'superior', 'first-class', 'world-class', 'industry-leading',
];

// Negative sentiment words
const NEGATIVE_WORDS = [
  'avoid', 'bad', 'poor', 'worst', 'terrible', 'awful',
  'complaints', 'issues', 'problems', 'concerns', 'risks',
  'unreliable', 'untrustworthy', 'unprofessional', 'inexperienced',
  'overpriced', 'expensive', 'costly', 'hidden fees',
  'slow', 'delayed', 'unresponsive', 'rude', 'unhelpful',
  'scam', 'fraud', 'lawsuit', 'legal issues', 'violations',
  'negative', 'criticized', 'controversial', 'questionable',
  'failing', 'struggling', 'declining', 'outdated',
  'disappointed', 'frustrating', 'unsatisfied', 'regret',
];

// Intensifiers that strengthen sentiment
const INTENSIFIERS = [
  'very', 'highly', 'extremely', 'incredibly', 'remarkably',
  'absolutely', 'definitely', 'certainly', 'truly', 'really',
  'particularly', 'especially', 'exceptionally',
];

// Negators that flip sentiment
const NEGATORS = [
  'not', 'no', 'never', 'neither', 'nor', 'none',
  "doesn't", "don't", "didn't", "won't", "wouldn't",
  "isn't", "aren't", "wasn't", "weren't",
  'lack', 'lacking', 'without', 'fail', 'fails',
];

/**
 * Analyze sentiment of an AI response regarding a brand
 * @param {string} responseText - The full AI response text
 * @param {string} brandName - The brand name to analyze sentiment for
 * @returns {Object} Sentiment analysis result
 */
export function analyzeSentiment(responseText, brandName) {
  if (!responseText || !brandName) {
    return { score: 0, label: 'neutral', details: [] };
  }

  const textLower = responseText.toLowerCase();
  const brandLower = brandName.toLowerCase();

  // Find sentences that mention the brand
  const sentences = extractSentences(responseText);
  const brandSentences = sentences.filter(s =>
    s.toLowerCase().includes(brandLower)
  );

  // If brand not mentioned, return neutral
  if (brandSentences.length === 0) {
    return { score: 0, label: 'neutral', details: [] };
  }

  // Analyze each brand-mentioning sentence
  const sentimentScores = [];
  const details = [];

  for (const sentence of brandSentences) {
    const analysis = analyzeSentence(sentence);
    sentimentScores.push(analysis.score);
    details.push({
      sentence: sentence.substring(0, 150),
      score: analysis.score,
      positiveWords: analysis.positiveWords,
      negativeWords: analysis.negativeWords,
    });
  }

  // Calculate average score
  const totalScore = sentimentScores.reduce((a, b) => a + b, 0);
  const avgScore = sentimentScores.length > 0
    ? totalScore / sentimentScores.length
    : 0;

  // Normalize to 0-1 scale
  const normalizedScore = (avgScore + 1) / 2;

  // Determine label
  let label;
  if (normalizedScore >= 0.65) {
    label = 'positive';
  } else if (normalizedScore <= 0.35) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  return {
    score: Math.round(normalizedScore * 100) / 100,
    label,
    details,
  };
}

/**
 * Extract sentences from text
 */
function extractSentences(text) {
  // Simple sentence splitting (handles common cases)
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.filter(s => s.length > 10);
}

/**
 * Analyze sentiment of a single sentence
 */
function analyzeSentence(sentence) {
  const sentenceLower = sentence.toLowerCase();
  const words = sentenceLower.split(/\s+/);

  let score = 0;
  const positiveFound = [];
  const negativeFound = [];

  // Track negation state
  let negated = false;
  let intensified = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^\w]/g, '');

    // Check for negators
    if (NEGATORS.includes(word)) {
      negated = true;
      continue;
    }

    // Check for intensifiers
    if (INTENSIFIERS.includes(word)) {
      intensified = true;
      continue;
    }

    // Check for positive words
    for (const positive of POSITIVE_WORDS) {
      if (word === positive || sentenceLower.includes(positive)) {
        let wordScore = 1;
        if (intensified) wordScore *= 1.5;
        if (negated) wordScore *= -1;

        score += wordScore;
        if (wordScore > 0) {
          positiveFound.push(positive);
        } else {
          negativeFound.push(positive);
        }

        // Reset modifiers
        negated = false;
        intensified = false;
        break;
      }
    }

    // Check for negative words
    for (const negative of NEGATIVE_WORDS) {
      if (word === negative || sentenceLower.includes(negative)) {
        let wordScore = -1;
        if (intensified) wordScore *= 1.5;
        if (negated) wordScore *= -1;

        score += wordScore;
        if (wordScore < 0) {
          negativeFound.push(negative);
        } else {
          positiveFound.push(negative);
        }

        // Reset modifiers
        negated = false;
        intensified = false;
        break;
      }
    }
  }

  // Normalize score to -1 to 1 range
  const maxPossible = Math.max(positiveFound.length + negativeFound.length, 1);
  const normalizedScore = Math.max(-1, Math.min(1, score / maxPossible));

  return {
    score: normalizedScore,
    positiveWords: [...new Set(positiveFound)],
    negativeWords: [...new Set(negativeFound)],
  };
}

export default analyzeSentiment;
