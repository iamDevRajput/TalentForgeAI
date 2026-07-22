/**
 * redis.js — ioredis singleton
 *
 * WHY singleton: BullMQ workers and the session cache must share one
 * underlying TCP connection pool to Redis, not open a new connection
 * per-request. A module-level singleton achieves this without a DI container.
 *
 * Connection is lazy — ioredis doesn't actually connect until the first
 * command. server.js pings it explicitly during startup to surface failures
 * early (same pattern as DB).
 */

import Redis from 'ioredis';
import { env } from './env.js';
import logger from './logger.js';

let redisClient = null;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,    // Required by BullMQ
      lazyConnect: true,
    });

    redisClient.on('connect', () => logger.info('✅  Redis connected'));
    redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting...'));
  }

  return redisClient;
}

/**
 * Explicitly pings Redis. Called by server.js during startup.
 */
export async function connectRedis() {
  const client = getRedisClient();
  await client.connect();
  await client.ping();
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
}
