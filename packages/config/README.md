# `@vassembly/config`

Environment-specific application configuration. Resolves `config` from `NODE_ENV` (or `VASSEMBLY_E2E=true` for e2e).

## Exports

### `config`
Resolved `Config` object for the current environment (`development`, `production`, or `testing`).

### `validatePlatformAiConfig(input: PlatformAiConfig): void`
Schema-only bootstrap validator for platform AI settings. Throws on invalid config (missing required fields, unsupported provider). Never includes API key values in errors. Call from app startup before accepting requests.

```typescript
import { config, validatePlatformAiConfig } from '@vassembly/config';

validatePlatformAiConfig(config.platformAi);
```

### Types
`Config`, `PlatformAiConfig`, `CacheConfig`, `RedisConfig`, `SkillsConfig`, `SkillScriptStorageConfig`, `Environment`, `CacheBackend`.

### `PlatformAiConfig`
Provider-agnostic platform LLM credential block on `config.platformAi`:

| Field | Env var | Notes |
|-------|---------|-------|
| `provider` | `PLATFORM_AI_PROVIDER` | Required. `gemini`, `deep_seek`, or `lm_studio` |
| `apiKey` | `PLATFORM_AI_API_KEY` | Required except for `lm_studio` |
| `baseUrl` | `PLATFORM_AI_BASE_URL` | Required for `deep_seek` and `lm_studio`; optional for `gemini` |
| `defaultModel` | `PLATFORM_AI_DEFAULT_MODEL` | Required. Model used for all platform-routed LLM calls |
| `organizationId` | `PLATFORM_AI_ORGANIZATION_ID` | Optional |

Used for platform-owned background work (task titles, specialization catalog enrichment). Validated at API boot via `validatePlatformAiConfig`.

### Legacy `deepSeekAi`
`config.deepSeekAi` / `DEEP_SEEK_AI_*` are **deprecated** — superseded by `platformAi` / `PLATFORM_AI_*`. Do not add new readers; removal tracked separately.

## Environment variables

### Platform AI

| Variable | Required | Description |
|----------|----------|-------------|
| `PLATFORM_AI_PROVIDER` | Yes | `gemini`, `deep_seek`, or `lm_studio` |
| `PLATFORM_AI_API_KEY` | Conditional | Required when provider ≠ `lm_studio` |
| `PLATFORM_AI_BASE_URL` | Conditional | Required for `deep_seek` and `lm_studio` |
| `PLATFORM_AI_DEFAULT_MODEL` | Yes | Default model for platform LLM invocations |
| `PLATFORM_AI_ORGANIZATION_ID` | No | Optional org id for supported providers |

### Cache and Redis

| Variable | Description | Default (development) |
|----------|-------------|------------------------|
| `CACHE_BACKEND` | `memory` or `redis` | `memory` |
| `CACHE_DEFAULT_TTL_MS` | Default entry TTL in milliseconds | `300000` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |

## Dependencies

No runtime npm dependencies.
