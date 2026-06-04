# `@vassembly/cache`

Multi-backend cache layer with memory and Redis stores.

## Usage

```typescript
import { CacheBackend, initCache, createNamespacedCache, getCacheStore } from '@vassembly/cache';

await initCache();
const store = getCacheStore();
const agentsCache = createNamespacedCache({ namespace: 'system-agent', store });

await agentsCache.set({ key: 'active-by-name:assistant', value: serialized });
const cached = await agentsCache.get({ key: 'active-by-name:assistant' });
```

## Configuration

| Variable | Values | Default (dev) |
|----------|--------|----------------|
| `CACHE_BACKEND` | `memory` \| `redis` | `memory` |
| `CACHE_DEFAULT_TTL_MS` | number | `300000` |
| `REDIS_URL` | connection string | `redis://localhost:6379` |

## API

- `initCache(params?)` — create the global store from config or test overrides
- `getCacheStore()` — access the global `CacheStore`
- `createNamespacedCache({ namespace, store })` — prefix keys as `namespace:key`
- `serializeCacheValue` / `deserializeCacheValue` — JSON helpers
- `resetCacheStoreForTests()` — clear singleton in tests

## Backends

- **Memory** — in-process `Map` with lazy TTL expiry on read
- **Redis** — uses `@vassembly/client-redis` with TTL in seconds

Unit tests always use the memory backend or injected mock Redis clients.
