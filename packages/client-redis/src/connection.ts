import { createClient } from 'redis';

import { config } from '@vassembly/config';
import { InternalError } from '@vassembly/errors';
import { logger } from '@vassembly/logger';

import type { RedisClientLike } from './types';

let redisClient: RedisClientLike | null = null;

const wrapRedisClient = (client: ReturnType<typeof createClient>): RedisClientLike => ({
  get: async ({ key }: { key: string }): Promise<string | null> => client.get(key),
  set: async ({
    key,
    value,
    ttlSeconds,
  }: {
    key: string;
    value: string;
    ttlSeconds?: number;
  }): Promise<void> => {
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await client.setEx(key, ttlSeconds, value);
      return;
    }
    await client.set(key, value);
  },
  del: async ({ key }: { key: string }): Promise<void> => {
    await client.del(key);
  },
});

export const initRedis = async (): Promise<void> => {
  if (redisClient !== null) {
    return;
  }

  const url = config.redis?.url;
  if (!url) {
    throw new InternalError('Redis URL is not configured');
  }

  try {
    const client = createClient({ url });
    await client.connect();
    await client.ping();
    redisClient = wrapRedisClient(client);
    logger('Redis successfully connected', {
      meta: { sessionId: 'APPLICATION_SETUP' },
    });
  } catch (error) {
    throw new InternalError('Failed to connect to Redis', error);
  }
};

export const getRedisClient = (): RedisClientLike => {
  if (redisClient === null) {
    throw new InternalError('Redis client is not initialized');
  }
  return redisClient;
};

export const resetRedisClientForTests = (): void => {
  redisClient = null;
};
