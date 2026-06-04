import { createNamespacedCache, getCacheStore } from '@vassembly/cache';

import type { NamespacedCache } from '@vassembly/cache';

export const SYSTEM_AGENT_CACHE_NAMESPACE = 'system-agent';

export const getSystemAgentCache = (): NamespacedCache =>
  createNamespacedCache({
    namespace: SYSTEM_AGENT_CACHE_NAMESPACE,
    store: getCacheStore(),
  });
