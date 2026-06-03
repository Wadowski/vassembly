export interface RedisGetParams {
  key: string;
}

export interface RedisSetParams {
  key: string;
  value: string;
  ttlSeconds?: number;
}

export interface RedisDelParams {
  key: string;
}

export interface RedisClientLike {
  get: (params: RedisGetParams) => Promise<string | null>;
  set: (params: RedisSetParams) => Promise<void>;
  del: (params: RedisDelParams) => Promise<void>;
}
