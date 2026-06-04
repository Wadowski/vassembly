import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockConnect, mockPing, mockGet, mockSet, mockDel, mockCreateClient } = vi.hoisted(() => {
  const mockConnect = vi.fn();
  const mockPing = vi.fn();
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockDel = vi.fn();
  const mockCreateClient = vi.fn(() => ({
    connect: mockConnect,
    ping: mockPing,
    get: mockGet,
    set: mockSet,
    del: mockDel,
  }));
  return { mockConnect, mockPing, mockGet, mockSet, mockDel, mockCreateClient };
});

vi.mock('redis', () => ({
  createClient: mockCreateClient,
}));

vi.mock('@vassembly/config', () => ({
  config: {
    redis: {
      url: 'redis://localhost:6379',
    },
  },
}));

import { getRedisClient, initRedis, resetRedisClientForTests } from './connection';

describe('client-redis connection', () => {
  afterEach(() => {
    resetRedisClientForTests();
    vi.clearAllMocks();
  });

  it('should initialize redis client when ping succeeds', async () => {
    mockConnect.mockResolvedValue(undefined);
    mockPing.mockResolvedValue('PONG');

    await initRedis();
    const client = getRedisClient();

    expect(client).toBeDefined();
    expect(mockCreateClient).toHaveBeenCalledWith({ url: 'redis://localhost:6379' });
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should throw when getRedisClient is called before init', () => {
    expect(() => getRedisClient()).toThrow('Redis client is not initialized');
  });
});
