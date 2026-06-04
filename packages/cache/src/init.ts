import { getRedisClient } from '@vassembly/client-redis';
import { CacheBackend, config } from '@vassembly/config';
import { InternalError } from '@vassembly/errors';
import { logger } from '@vassembly/logger';

import { createMemoryCacheStore } from './memoryCacheStore';
import { createRedisCacheStore } from './redisCacheStore';

import type { CacheStore, InitCacheParams } from './types';

let cacheStore: CacheStore | null = null;

export const initCache = async (params?: InitCacheParams): Promise<void> => {
  const backend = params?.backend ?? config.cache.backend;
  const defaultTtlMs = params?.defaultTtlMs ?? config.cache.defaultTtlMs;

  if (backend === CacheBackend.Redis) {
    const client = params?.redisClient ?? getRedisClient();
    cacheStore = createRedisCacheStore({ client, defaultTtlMs });
    logger('Cache initialized with Redis backend', {
      meta: { sessionId: 'APPLICATION_SETUP' },
    });
    return;
  }

  cacheStore = createMemoryCacheStore({ defaultTtlMs });
  logger('Cache initialized with memory backend', {
    meta: { sessionId: 'APPLICATION_SETUP' },
  });
};

export const getCacheStore = (): CacheStore => {
  if (cacheStore === null) {
    throw new InternalError('Cache store is not initialized');
  }
  return cacheStore;
};

export const resetCacheStoreForTests = (): void => {
  cacheStore = null;
};
