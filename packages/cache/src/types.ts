export interface CacheGetParams {
  key: string;
}

export interface CacheSetParams {
  key: string;
  value: string;
  ttlMs?: number;
}

export interface CacheDeleteParams {
  key: string;
}

export interface CacheDeleteManyParams {
  keys: string[];
}

export interface CacheStore {
  get: (params: CacheGetParams) => Promise<string | null>;
  set: (params: CacheSetParams) => Promise<void>;
  delete: (params: CacheDeleteParams) => Promise<void>;
  deleteMany: (params: CacheDeleteManyParams) => Promise<void>;
}

export interface NamespacedCacheGetParams {
  key: string;
}

export interface NamespacedCacheSetParams {
  key: string;
  value: string;
  ttlMs?: number;
}

export interface NamespacedCacheDeleteParams {
  key: string;
}

export interface NamespacedCacheDeleteManyParams {
  keys: string[];
}

export interface NamespacedCache {
  get: (params: NamespacedCacheGetParams) => Promise<string | null>;
  set: (params: NamespacedCacheSetParams) => Promise<void>;
  delete: (params: NamespacedCacheDeleteParams) => Promise<void>;
  deleteMany: (params: NamespacedCacheDeleteManyParams) => Promise<void>;
}

export interface CreateNamespacedCacheParams {
  namespace: string;
  store: CacheStore;
}

export interface SerializeCacheValueParams<T> {
  value: T;
}

export interface DeserializeCacheValueParams {
  serialized: string;
}

export interface InitCacheParams {
  backend?: import('@vassembly/config').CacheBackend;
  defaultTtlMs?: number;
  redisClient?: import('@vassembly/client-redis').RedisClientLike;
}

export interface MemoryCacheStoreParams {
  defaultTtlMs: number;
}

export interface RedisCacheStoreParams {
  client: import('@vassembly/client-redis').RedisClientLike;
  defaultTtlMs: number;
}
