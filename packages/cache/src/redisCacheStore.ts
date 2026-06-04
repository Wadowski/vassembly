import type {
  CacheDeleteManyParams,
  CacheDeleteParams,
  CacheGetParams,
  CacheSetParams,
  CacheStore,
  RedisCacheStoreParams,
} from './types';

const toTtlSeconds = ({ ttlMs, defaultTtlMs }: { ttlMs?: number; defaultTtlMs: number }): number | undefined => {
  const resolved = ttlMs ?? defaultTtlMs;
  if (resolved <= 0) {
    return undefined;
  }
  return Math.ceil(resolved / 1000);
};

export const createRedisCacheStore = ({
  client,
  defaultTtlMs,
}: RedisCacheStoreParams): CacheStore => ({
  get: async ({ key }: CacheGetParams): Promise<string | null> => client.get({ key }),
  set: async ({ key, value, ttlMs }: CacheSetParams): Promise<void> => {
    const ttlSeconds = toTtlSeconds({ ttlMs, defaultTtlMs });
    await client.set({ key, value, ttlSeconds });
  },
  delete: async ({ key }: CacheDeleteParams): Promise<void> => {
    await client.del({ key });
  },
  deleteMany: async ({ keys }: CacheDeleteManyParams): Promise<void> => {
    await Promise.all(keys.map((key) => client.del({ key })));
  },
});
