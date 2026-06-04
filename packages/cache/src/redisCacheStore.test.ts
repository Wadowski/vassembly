import { describe, expect, it, vi } from 'vitest';

import { createRedisCacheStore } from './redisCacheStore';

import type { RedisClientLike } from '@vassembly/client-redis';

const createMockRedisClient = (): RedisClientLike & {
  getMock: ReturnType<typeof vi.fn>;
  setMock: ReturnType<typeof vi.fn>;
  delMock: ReturnType<typeof vi.fn>;
} => {
  const getMock = vi.fn();
  const setMock = vi.fn();
  const delMock = vi.fn();

  return {
    getMock,
    setMock,
    delMock,
    get: getMock,
    set: setMock,
    del: delMock,
  };
};

describe('redis cache store', () => {
  it('should delegate get to redis client', async () => {
    const client = createMockRedisClient();
    client.getMock.mockResolvedValue('cached');
    const store = createRedisCacheStore({ client, defaultTtlMs: 60_000 });

    await expect(store.get({ key: 'agent' })).resolves.toBe('cached');
    expect(client.getMock).toHaveBeenCalledWith({ key: 'agent' });
  });

  it('should set value with ttl in seconds from default ttl', async () => {
    const client = createMockRedisClient();
    const store = createRedisCacheStore({ client, defaultTtlMs: 2_500 });

    await store.set({ key: 'agent', value: 'payload' });

    expect(client.setMock).toHaveBeenCalledWith({
      key: 'agent',
      value: 'payload',
      ttlSeconds: 3,
    });
  });

  it('should delete many keys in parallel', async () => {
    const client = createMockRedisClient();
    const store = createRedisCacheStore({ client, defaultTtlMs: 60_000 });

    await store.deleteMany({ keys: ['a', 'b'] });

    expect(client.delMock).toHaveBeenCalledTimes(2);
    expect(client.delMock).toHaveBeenCalledWith({ key: 'a' });
    expect(client.delMock).toHaveBeenCalledWith({ key: 'b' });
  });
});
