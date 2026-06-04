# `@vassembly/client-redis`

Redis connection singleton for backend services.

## Usage

```typescript
import { initRedis, getRedisClient } from '@vassembly/client-redis';

await initRedis();
const client = getRedisClient();
await client.set({ key: 'example', value: 'payload', ttlSeconds: 60 });
```

## Configuration

Set `REDIS_URL` in the environment. Used when `CACHE_BACKEND=redis`.

## API

- `initRedis()` — connect once at application startup
- `getRedisClient()` — returns a minimal `RedisClientLike` (`get`, `set`, `del`)
- `resetRedisClientForTests()` — clears the singleton for unit tests
