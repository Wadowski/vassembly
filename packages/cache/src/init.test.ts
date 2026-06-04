import { afterEach, describe, expect, it } from 'vitest';

import { CacheBackend } from '@vassembly/config';

import { getCacheStore, initCache, resetCacheStoreForTests } from './init';

import type { RedisClientLike } from '@vassembly/client-redis';

const createMockRedisClient = (): RedisClientLike => ({
  get: async () => null,
  set: async () => undefined,
  del: async () => undefined,
});

describe('cache init', () => {
  afterEach(() => {
    resetCacheStoreForTests();
  });

  it('should initialize memory backend from test params', async () => {
    await initCache({ backend: CacheBackend.Memory, defaultTtlMs: 1_000 });

    const store = getCacheStore();
    await store.set({ key: 'k', value: 'v' });

    await expect(store.get({ key: 'k' })).resolves.toBe('v');
  });

  it('should initialize redis backend with injected client', async () => {
    const client = createMockRedisClient();

    await initCache({
      backend: CacheBackend.Redis,
      defaultTtlMs: 1_000,
      redisClient: client,
    });

    expect(getCacheStore()).toBeDefined();
  });

  it('should throw when getCacheStore is called before init', () => {
    expect(() => getCacheStore()).toThrow(/Cache store is not initialized/);
  });
});
