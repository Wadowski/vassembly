import type {
  CacheDeleteManyParams,
  CacheDeleteParams,
  CacheGetParams,
  CacheSetParams,
  CacheStore,
  MemoryCacheStoreParams,
} from './types';

interface MemoryCacheEntry {
  value: string;
  expiresAt: number | null;
}

export const createMemoryCacheStore = ({
  defaultTtlMs,
}: MemoryCacheStoreParams): CacheStore => {
  const entries = new Map<string, MemoryCacheEntry>();

  const isExpired = (entry: MemoryCacheEntry): boolean =>
    entry.expiresAt !== null && entry.expiresAt <= Date.now();

  const pruneIfExpired = (key: string): void => {
    const entry = entries.get(key);
    if (entry && isExpired(entry)) {
      entries.delete(key);
    }
  };

  const resolveTtlMs = (ttlMs: number | undefined): number | null => {
    const resolved = ttlMs ?? defaultTtlMs;
    if (resolved <= 0) {
      return null;
    }
    return resolved;
  };

  return {
    get: async ({ key }: CacheGetParams): Promise<string | null> => {
      pruneIfExpired(key);
      const entry = entries.get(key);
      if (!entry || isExpired(entry)) {
        return null;
      }
      return entry.value;
    },
    set: async ({ key, value, ttlMs }: CacheSetParams): Promise<void> => {
      const resolvedTtlMs = resolveTtlMs(ttlMs);
      const expiresAt =
        resolvedTtlMs === null ? null : Date.now() + resolvedTtlMs;
      entries.set(key, { value, expiresAt });
    },
    delete: async ({ key }: CacheDeleteParams): Promise<void> => {
      entries.delete(key);
    },
    deleteMany: async ({ keys }: CacheDeleteManyParams): Promise<void> => {
      for (const key of keys) {
        entries.delete(key);
      }
    },
  };
};
