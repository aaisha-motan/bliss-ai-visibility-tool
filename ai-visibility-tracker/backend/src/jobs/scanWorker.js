import scanQueue from './queue.js';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { runScan } from '../services/scanOrchestrator.js';

// Process scan jobs
scanQueue.process('process-scan', 1, async (job) => {
  const { scanId, clientId, userId, prompts } = job.data;

  logger.info(`Processing scan job ${job.id} for scan ${scanId}`);

  try {
    // Update scan status to running
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        currentStep: 'Initializing scan...',
      },
    });

    // Run the scan
    const report = await runScan({
      scanId,
      clientId,
      userId,
      prompts,
      onProgress: async (progress, currentStep) => {
        await prisma.scan.update({
          where: { id: scanId },
          data: { progress, currentStep },
        });
        job.progress(progress);
      },
    });

    // Mark scan as completed
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        currentStep: 'Scan completed successfully',
        progress: 100,
      },
    });

    logger.info(`Scan ${scanId} completed successfully, report ${report.id} created`);

    return { success: true, reportId: report.id };
  } catch (error) {
    logger.error(`Scan ${scanId} failed:`, error);

    // Mark scan as failed
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        error: error.message,
        currentStep: `Failed: ${error.message}`,
      },
    });

    throw error;
  }
});

logger.info('Scan worker initialized');

export default scanQueue;
