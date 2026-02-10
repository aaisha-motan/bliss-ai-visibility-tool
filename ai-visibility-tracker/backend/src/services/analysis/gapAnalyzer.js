/**
 * Gap Analysis Service
 * Compares client visibility against competitors across prompts and engines
 */

// Mention type scores for gap calculation
const MENTION_SCORES = {
  FEATURED: 3,
  MENTIONED: 2,
  COMPETITOR_ONLY: 0,
  NOT_FOUND: 0,
};

/**
 * Analyze gaps between client and competitor visibility
 * @param {Array} promptResults - Array of prompt results with engine results
 * @param {string} clientName - The client's brand name
 * @param {string[]} competitors - List of known competitors
 * @returns {Object} Gap analysis results
 */
export function analyzeGaps(promptResults, clientName, competitors) {
  const gaps = [];
  const recommendations = [];
  let totalGapScore = 0;

  // Analyze each prompt
  for (const promptResult of promptResults) {
    const { prompt, engineResults } = promptResult;
    const promptGaps = [];

    // Analyze each engine for this prompt
    for (const engineResult of engineResults) {
      const {
        engine,
        mentionType,
        rankingPosition,
        competitorsMentioned,
      } = engineResult;

      const clientScore = MENTION_SCORES[mentionType] || 0;
      const clientVisible = mentionType === 'FEATURED' || mentionType === 'MENTIONED';

      // Check competitor visibility
      const visibleCompetitors = competitorsMentioned || [];

      // Identify gaps
      if (!clientVisible && visibleCompetitors.length > 0) {
        // RED ALERT: Competitors visible but client is not
        const gap = {
          type: 'RED',
          prompt: prompt.substring(0, 100),
          engine,
          clientStatus: mentionType,
          clientPosition: rankingPosition,
          competitors: visibleCompetitors,
          message: `${visibleCompetitors.join(', ')} appear${visibleCompetitors.length === 1 ? 's' : ''} but ${clientName} does not`,
        };
        promptGaps.push(gap);
        totalGapScore += visibleCompetitors.length * 3;
      } else if (mentionType === 'MENTIONED' && visibleCompetitors.length > 0) {
        // Check if any competitor is featured while client is only mentioned
        // This would require position data
        if (rankingPosition && rankingPosition > 1) {
          const gap = {
            type: 'YELLOW',
            prompt: prompt.substring(0, 100),
            engine,
            clientStatus: mentionType,
            clientPosition: rankingPosition,
            competitors: visibleCompetitors,
            message: `${clientName} ranks #${rankingPosition} while competitors also appear`,
          };
          promptGaps.push(gap);
          totalGapScore += 1;
        }
      } else if (mentionType === 'FEATURED') {
        // GREEN: Client is featured
        const gap = {
          type: 'GREEN',
          prompt: prompt.substring(0, 100),
          engine,
          clientStatus: mentionType,
          clientPosition: rankingPosition || 1,
          competitors: visibleCompetitors,
          message: `${clientName} is featured as top recommendation`,
        };
        promptGaps.push(gap);
      }
    }

    gaps.push({
      prompt,
      gaps: promptGaps,
    });
  }

  // Generate recommendations based on gaps
  const redGaps = gaps.flatMap(g => g.gaps).filter(g => g.type === 'RED');
  const yellowGaps = gaps.flatMap(g => g.gaps).filter(g => g.type === 'YELLOW');
  const greenGaps = gaps.flatMap(g => g.gaps).filter(g => g.type === 'GREEN');

  if (redGaps.length > 0) {
    // Group by competitor
    const competitorCounts = {};
    for (const gap of redGaps) {
      for (const comp of gap.competitors) {
        competitorCounts[comp] = (competitorCounts[comp] || 0) + 1;
      }
    }

    const topCompetitors = Object.entries(competitorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    if (topCompetitors.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        type: 'COMPETITOR_OUTRANKING',
        message: `Focus on content optimization — ${topCompetitors.join(', ')} frequently appear in AI responses where ${clientName} is missing`,
        actionItems: [
          'Analyze competitor content that AI systems are referencing',
          'Create comprehensive, authoritative content for missing topics',
          'Ensure brand name appears naturally in relevant content',
          'Build citations and references from authoritative sources',
        ],
      });
    }

    // Group by engine
    const engineCounts = {};
    for (const gap of redGaps) {
      engineCounts[gap.engine] = (engineCounts[gap.engine] || 0) + 1;
    }

    const worstEngine = Object.entries(engineCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (worstEngine) {
      const engineName = formatEngineName(worstEngine[0]);
      recommendations.push({
        priority: 'MEDIUM',
        type: 'ENGINE_SPECIFIC',
        message: `${engineName} shows lowest visibility — prioritize optimization for this platform`,
        actionItems: [
          `Research how ${engineName} sources information`,
          'Ensure content is accessible and well-structured',
          'Build presence on platforms that the engine references',
        ],
      });
    }
  }

  if (yellowGaps.length > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      type: 'RANKING_IMPROVEMENT',
      message: `Improve ranking position — ${clientName} is mentioned but not as the top recommendation in ${yellowGaps.length} instance(s)`,
      actionItems: [
        'Strengthen unique value proposition in content',
        'Gather more positive reviews and testimonials',
        'Create comparison content highlighting advantages',
      ],
    });
  }

  if (greenGaps.length > 0) {
    recommendations.push({
      priority: 'LOW',
      type: 'MAINTAIN_POSITION',
      message: `Strong visibility on ${greenGaps.length} prompt(s) — maintain current strategy`,
      actionItems: [
        'Continue creating quality content',
        'Monitor for changes in AI response patterns',
        'Keep information up-to-date',
      ],
    });
  }

  // Calculate overall gap score (0-100, where 0 is best)
  const maxGapScore = promptResults.length * 3 * competitors.length;
  const normalizedGapScore = maxGapScore > 0
    ? Math.round((totalGapScore / maxGapScore) * 100)
    : 0;

  return {
    gaps,
    recommendations,
    summary: {
      totalPrompts: promptResults.length,
      redAlerts: redGaps.length,
      yellowAlerts: yellowGaps.length,
      greenCount: greenGaps.length,
      overallGapScore: normalizedGapScore,
    },
  };
}

/**
 * Format engine name for display
 */
function formatEngineName(engine) {
  const names = {
    CHATGPT: 'ChatGPT',
    PERPLEXITY: 'Perplexity',
    GOOGLE_AIO: 'Google AI Overview',
  };
  return names[engine] || engine;
}

export default analyzeGaps;
