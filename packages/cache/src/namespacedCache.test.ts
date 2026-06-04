import { describe, expect, it } from 'vitest';

import { createMemoryCacheStore } from './memoryCacheStore';
import { createNamespacedCache } from './namespacedCache';

describe('namespaced cache', () => {
  it('should prefix keys with namespace', async () => {
    const store = createMemoryCacheStore({ defaultTtlMs: 60_000 });
    const namespaced = createNamespacedCache({ namespace: 'system-agent', store });

    await namespaced.set({ key: 'active-by-name:assistant', value: 'payload' });

    await expect(
      store.get({ key: 'system-agent:active-by-name:assistant' }),
    ).resolves.toBe('payload');
    await expect(
      namespaced.get({ key: 'active-by-name:assistant' }),
    ).resolves.toBe('payload');
  });
});
