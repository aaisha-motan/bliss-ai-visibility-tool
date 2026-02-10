import Queue from 'bull';
import config from '../config/env.js';
import logger from '../utils/logger.js';

// Create scan queue
const scanQueue = new Queue('scan-queue', config.redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// Queue event handlers
scanQueue.on('error', (error) => {
  logger.error('Scan queue error:', error);
});

scanQueue.on('waiting', (jobId) => {
  logger.debug(`Job ${jobId} is waiting`);
});

scanQueue.on('active', (job) => {
  logger.info(`Job ${job.id} has started processing`);
});

scanQueue.on('completed', (job, result) => {
  logger.info(`Job ${job.id} completed with result:`, result?.reportId);
});

scanQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed:`, err.message);
});

// Add job helper
export async function addScanJob(data) {
  const job = await scanQueue.add('process-scan', data, {
    priority: 1,
  });
  logger.info(`Scan job ${job.id} added to queue for client ${data.clientId}`);
  return job;
}

// Get queue status
export async function getQueueStatus() {
  const [waiting, active, completed, failed] = await Promise.all([
    scanQueue.getWaitingCount(),
    scanQueue.getActiveCount(),
    scanQueue.getCompletedCount(),
    scanQueue.getFailedCount(),
  ]);

  return { waiting, active, completed, failed };
}

export default scanQueue;
