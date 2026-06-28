# @vassembly/domain-ai-integration

Domain package for AI integration credentials and LLM client resolution — user-owned stored credentials and platform env config.

## Exports

### `commands`

- `create`, `update`, `removeSoft`, `restore` — credential CRUD
- `testProviderConnection`, `assertProviderConnection` — provider connectivity checks
- **`resolveAndBuildClient`** — builds a modeled provider client from a user's stored credential (DB lookup, ownership and connection validation, encrypted key decode). Use for user-benefiting LLM work (task execution, agent invoke from UI).
- **`resolvePlatformClient`** — builds a modeled provider client from `config.platformAi` (no DB lookup, no ownership check, plaintext env key). Use for platform-owned background work (task titles, specialization classification, catalog enrichment).

```typescript
import aiIntegrationDomain from '@vassembly/domain-ai-integration';

// User credential path
const { client, integrationSnapshot } = await aiIntegrationDomain.commands.resolveAndBuildClient({
  userId,
  integrationCredentialId,
});

// Platform credential path
const { client, integrationSnapshot } = await aiIntegrationDomain.commands.resolvePlatformClient();
```

Both commands return `ResolveAndBuildClientResult` (`{ client, integrationSnapshot }`).

### `queries`
`getById`, `getListForUser`, `getListByProvider`

### Other
- `gqlSchema` — GraphQL types for credential list/detail DTOs
- `mongodbIndexes` — MongoDB index bootstrap
- `toAiIntegrationResponse` — maps model to public DTO (no secrets)
- `AiIntegrationProvider`, `AiIntegrationStatus`, `AiIntegrationConnectionStatus` — constants

## Dependencies

- **@vassembly/config** — `config.platformAi` for `resolvePlatformClient`
- **@vassembly/client-langchain** — modeled provider client (via `clients/langchain.ts` only)
- **@vassembly/client-encoder** — decode encrypted user API keys in `resolveAndBuildClient`
- **@vassembly/client-mongodb** — credential persistence
- **@vassembly/commands**, **@vassembly/queries**, **@vassembly/model**, **@vassembly/mappers**, **@vassembly/graphql**, **@vassembly/errors**, **@vassembly/validation** — domain infrastructure
