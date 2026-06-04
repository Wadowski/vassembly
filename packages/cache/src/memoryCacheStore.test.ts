import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMemoryCacheStore } from './memoryCacheStore';

describe('memory cache store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null when key is missing', async () => {
    const store = createMemoryCacheStore({ defaultTtlMs: 60_000 });

    await expect(store.get({ key: 'missing' })).resolves.toBeNull();
  });

  it('should store and retrieve a value', async () => {
    const store = createMemoryCacheStore({ defaultTtlMs: 60_000 });

    await store.set({ key: 'agent', value: 'payload' });

    await expect(store.get({ key: 'agent' })).resolves.toBe('payload');
  });

  it('should expire entries lazily on get after ttl', async () => {
    const store = createMemoryCacheStore({ defaultTtlMs: 1_000 });

    await store.set({ key: 'agent', value: 'payload' });
    vi.advanceTimersByTime(1_001);

    await expect(store.get({ key: 'agent' })).resolves.toBeNull();
  });

  it('should delete single and multiple keys', async () => {
    const store = createMemoryCacheStore({ defaultTtlMs: 60_000 });

    await store.set({ key: 'a', value: '1' });
    await store.set({ key: 'b', value: '2' });
    await store.delete({ key: 'a' });
    await store.deleteMany({ keys: ['b'] });

    await expect(store.get({ key: 'a' })).resolves.toBeNull();
    await expect(store.get({ key: 'b' })).resolves.toBeNull();
  });
});
