/**
 * Calculate visibility score from mention type
 * @param {string} mentionType - FEATURED, MENTIONED, COMPETITOR_ONLY, NOT_FOUND
 * @returns {number} - Score value
 */
export function getMentionScore(mentionType) {
  const scores = {
    FEATURED: 3,
    MENTIONED: 2,
    COMPETITOR_ONLY: 0,
    NOT_FOUND: 0,
  };
  return scores[mentionType] || 0;
}

/**
 * Calculate overall visibility score from engine results
 * @param {Array} engineResults - Array of engine result objects
 * @returns {number} - Visibility score (0-100)
 */
export function calculateVisibilityScore(engineResults) {
  if (!engineResults || engineResults.length === 0) return 0;

  const totalPossible = engineResults.length * 3; // Max score if all FEATURED
  const actual = engineResults.reduce(
    (sum, result) => sum + getMentionScore(result.mentionType),
    0
  );

  return Math.round((actual / totalPossible) * 100);
}

/**
 * Get visibility rate for an engine
 * @param {Object} engineStats - Stats for an engine { featured, mentioned, competitorOnly, notFound }
 * @returns {number} - Visibility rate (0-100)
 */
export function getEngineVisibilityRate(engineStats) {
  if (!engineStats) return 0;

  const visible = (engineStats.featured || 0) + (engineStats.mentioned || 0);
  const total = Object.values(engineStats).reduce((a, b) => a + b, 0);

  return total > 0 ? Math.round((visible / total) * 100) : 0;
}

/**
 * Identify gaps between client and competitor visibility
 * @param {Array} promptResults - Array of prompt result objects
 * @returns {Array} - Array of gap objects
 */
export function identifyGaps(promptResults) {
  const gaps = [];

  for (const pr of promptResults) {
    const clientVisible = pr.engineResults.filter(
      er => er.mentionType === 'FEATURED' || er.mentionType === 'MENTIONED'
    ).length;

    const competitorMentions = pr.engineResults.reduce(
      (sum, er) => sum + (er.competitorsMentioned?.length || 0),
      0
    );

    if (competitorMentions > 0 && clientVisible < 3) {
      gaps.push({
        prompt: pr.prompt,
        clientVisible,
        competitorMentions,
        severity: clientVisible === 0 ? 'high' : 'medium',
        engines: pr.engineResults.map(er => ({
          engine: er.engine,
          mentionType: er.mentionType,
          competitors: er.competitorsMentioned || [],
        })),
      });
    }
  }

  return gaps;
}

/**
 * Aggregate competitor mentions across all results
 * @param {Array} promptResults - Array of prompt result objects
 * @returns {Array} - Sorted array of { name, count } objects
 */
export function aggregateCompetitorMentions(promptResults) {
  const counts = {};

  for (const pr of promptResults) {
    for (const er of pr.engineResults) {
      for (const competitor of er.competitorsMentioned || []) {
        counts[competitor] = (counts[competitor] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get color for a score
 * @param {number} score - Score (0-100)
 * @param {Object} theme - Theme object with color values
 * @returns {string} - Color value
 */
export function getScoreColor(score, theme) {
  if (score >= 60) return theme.green;
  if (score >= 30) return theme.yellow;
  return theme.red;
}

/**
 * Get label for a score
 * @param {number} score - Score (0-100)
 * @returns {string} - Score label
 */
export function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

export default {
  getMentionScore,
  calculateVisibilityScore,
  getEngineVisibilityRate,
  identifyGaps,
  aggregateCompetitorMentions,
  getScoreColor,
  getScoreLabel,
};
