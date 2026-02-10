import Redis from 'ioredis';
import config from './env.js';
import logger from '../utils/logger.js';

let redis = null;

export function getRedisClient() {
  if (!redis) {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }
  return redis;
}

export default getRedisClient;
