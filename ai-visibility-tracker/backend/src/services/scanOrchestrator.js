import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { getDecryptedSettings } from '../controllers/settings.controller.js';
import { scanChatGPT } from './engines/chatgpt.engine.js';
import { scanPerplexity } from './engines/perplexity.engine.js';
import { scanGoogle } from './engines/google.engine.js';
import { detectMention } from './analysis/mentionDetector.js';
import { trackCompetitors } from './analysis/competitorTracker.js';
import { analyzeSentiment } from './analysis/sentimentAnalyzer.js';
import { analyzeGaps } from './analysis/gapAnalyzer.js';
import config from '../config/env.js';

// Random delay helper
function randomDelay(min = config.scanDelayMin, max = config.scanDelayMax) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export async function runScan({ scanId, clientId, userId, prompts, onProgress }) {
  logger.info(`Starting scan ${scanId} for client ${clientId}`);

  // Get client info
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      name: true,
      domain: true,
      competitors: true,
      industry: true,
      location: true,
    },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  // Get user settings with decrypted API keys
  const settings = await getDecryptedSettings(userId);

  const totalPrompts = prompts.length;
  const promptResults = [];
  const allNewCompetitors = new Set();

  // Helper to calculate progress: each prompt is worth ~90% / totalPrompts
  // Reserve 5% for init and 5% for report generation
  const calcProgress = (promptIndex, engineProgress = 0) => {
    const baseProgress = 5; // 5% for initialization
    const perPromptProgress = 90 / totalPrompts;
    return Math.round(baseProgress + (promptIndex * perPromptProgress) + (engineProgress * perPromptProgress / 100));
  };

  // Initial progress update
  await onProgress(5, 'Starting scan...');

  // Process each prompt
  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const engineResults = [];

    logger.info(`Processing prompt ${i + 1}/${prompts.length}: "${prompt.substring(0, 50)}..."`);

    // Update progress at start of each prompt
    await onProgress(calcProgress(i, 0), `Processing prompt ${i + 1}/${totalPrompts}`);

    // Run all 3 engines (can run in parallel if resources allow)
    const enginePromises = [
      // ChatGPT
      (async () => {
        await onProgress(
          calcProgress(i, 10),
          `Scanning ChatGPT: prompt ${i + 1}/${totalPrompts}`
        );

        try {
          const result = await scanChatGPT(prompt, settings?.chatgptSessionToken);
          await onProgress(calcProgress(i, 33), `ChatGPT done: prompt ${i + 1}/${totalPrompts}`);
          return { engine: 'CHATGPT', ...result };
        } catch (error) {
          logger.error(`ChatGPT scan failed for prompt "${prompt}":`, error.message);
          return {
            engine: 'CHATGPT',
            responseText: `Error: ${error.message}`,
            screenshotPath: null,
            error: true,
          };
        }
      })(),

      // Perplexity
      (async () => {
        await randomDelay(1000, 2000); // Slight stagger
        await onProgress(
          calcProgress(i, 20),
          `Scanning Perplexity: prompt ${i + 1}/${totalPrompts}`
        );

        try {
          const result = await scanPerplexity(prompt, settings?.perplexitySessionToken, settings?.firecrawlApiKey);
          await onProgress(calcProgress(i, 66), `Perplexity done: prompt ${i + 1}/${totalPrompts}`);
          return { engine: 'PERPLEXITY', ...result };
        } catch (error) {
          logger.error(`Perplexity scan failed for prompt "${prompt}":`, error.message);
          return {
            engine: 'PERPLEXITY',
            responseText: `Error: ${error.message}`,
            screenshotPath: null,
            error: true,
          };
        }
      })(),

      // Google AI Overview
      (async () => {
        await randomDelay(500, 1500);
        await onProgress(
          calcProgress(i, 15),
          `Scanning Google AI Overview: prompt ${i + 1}/${totalPrompts}`
        );

        try {
          const result = await scanGoogle(prompt, settings?.serpApiKey);
          await onProgress(calcProgress(i, 100), `All engines done: prompt ${i + 1}/${totalPrompts}`);
          return { engine: 'GOOGLE_AIO', ...result };
        } catch (error) {
          logger.error(`Google AIO scan failed for prompt "${prompt}":`, error.message);
          return {
            engine: 'GOOGLE_AIO',
            responseText: `Error: ${error.message}`,
            screenshotPath: null,
            error: true,
          };
        }
      })(),
    ];

    // Wait for all engines to complete
    const results = await Promise.all(enginePromises);

    // Analyze each engine result
    for (const result of results) {
      if (result.error) {
        engineResults.push({
          engine: result.engine,
          responseText: result.responseText,
          screenshotPath: null,
          mentionType: 'NOT_FOUND',
          rankingPosition: null,
          sentimentScore: 0,
          competitorsMentioned: [],
          newCompetitorsFound: [],
        });
        continue;
      }

      // Run analysis
      const mention = detectMention(result.responseText, client.name, client.domain);
      const competitors = trackCompetitors(result.responseText, client.competitors);
      const sentiment = analyzeSentiment(result.responseText, client.name);

      // Add new competitors to set
      competitors.newCompetitors.forEach(c => allNewCompetitors.add(c));

      engineResults.push({
        engine: result.engine,
        responseText: result.responseText,
        screenshotPath: result.screenshotPath || null,
        mentionType: mention.type,
        rankingPosition: mention.position,
        sentimentScore: sentiment.score,
        competitorsMentioned: competitors.mentioned,
        newCompetitorsFound: competitors.newCompetitors,
      });
    }

    promptResults.push({
      prompt,
      engineResults,
    });

    // Add delay between prompts to avoid rate limiting
    if (i < prompts.length - 1) {
      await randomDelay();
    }
  }

  await onProgress(95, 'Analyzing results and generating report...');

  // Calculate aggregates
  let featuredCount = 0;
  let mentionedCount = 0;
  let competitorOnlyCount = 0;
  let notFoundCount = 0;

  const engineScores = {
    CHATGPT: { visible: 0, total: 0 },
    PERPLEXITY: { visible: 0, total: 0 },
    GOOGLE_AIO: { visible: 0, total: 0 },
  };

  for (const pr of promptResults) {
    for (const er of pr.engineResults) {
      engineScores[er.engine].total++;

      if (er.mentionType === 'FEATURED') {
        featuredCount++;
        engineScores[er.engine].visible++;
      } else if (er.mentionType === 'MENTIONED') {
        mentionedCount++;
        engineScores[er.engine].visible++;
      } else if (er.mentionType === 'COMPETITOR_ONLY') {
        competitorOnlyCount++;
      } else {
        notFoundCount++;
      }
    }
  }

  // Calculate overall score (weighted)
  const totalResponses = promptResults.length * 3;
  const maxScore = totalResponses * 3; // Max score if all FEATURED
  const actualScore = (featuredCount * 3) + (mentionedCount * 2);
  const overallScore = Math.round((actualScore / maxScore) * 100);

  // Find best/worst engine
  const engineRates = Object.entries(engineScores).map(([engine, data]) => ({
    engine,
    rate: data.total > 0 ? (data.visible / data.total) * 100 : 0,
  }));

  const bestEngine = engineRates.reduce((a, b) => a.rate > b.rate ? a : b).engine;
  const worstEngine = engineRates.reduce((a, b) => a.rate < b.rate ? a : b).engine;

  // Create report
  const report = await prisma.report.create({
    data: {
      clientId,
      scanId,
      overallScore,
      promptCount: prompts.length,
      featuredCount,
      mentionedCount,
      competitorOnlyCount,
      notFoundCount,
      bestEngine,
      worstEngine,
      newCompetitorsDetected: Array.from(allNewCompetitors),
      promptResults: {
        create: promptResults.map(pr => ({
          prompt: pr.prompt,
          engineResults: {
            create: pr.engineResults.map(er => ({
              engine: er.engine,
              responseText: er.responseText,
              screenshotPath: er.screenshotPath,
              mentionType: er.mentionType,
              rankingPosition: er.rankingPosition,
              sentimentScore: er.sentimentScore,
              competitorsMentioned: er.competitorsMentioned,
              newCompetitorsFound: er.newCompetitorsFound,
            })),
          },
        })),
      },
    },
  });

  await onProgress(100, 'Scan completed');

  logger.info(`Report ${report.id} created for scan ${scanId}`);

  return report;
}

export default runScan;
