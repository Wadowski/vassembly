# `@vassembly/config`

Environment-specific application configuration.

## Cache and Redis

| Variable | Description | Default (development) |
|----------|-------------|------------------------|
| `CACHE_BACKEND` | `memory` or `redis` | `memory` |
| `CACHE_DEFAULT_TTL_MS` | Default entry TTL in milliseconds | `300000` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
