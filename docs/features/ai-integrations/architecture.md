# AI Integrations — Implementation Architecture

**Status:** Implementation in progress  
**Last updated:** 2026-05-24  
**Recent:** Migrated from separate client packages to unified `@vassembly/client-langchain` (LangChain-based, v1.1)  
**Related:** Product requirements (per-user AI API integrations with secure credential storage, connection testing, agent workflow integration)

This document defines the complete system architecture for AI Integrations. It incorporates a **librarian catalog pass** (~85% reuse of the agent stack) and exploration of existing patterns (`domain-agent`, `@vassembly/client-encoder`, `@vassembly/client-ai-deepseek`, `service-auth` authorization).

---

## Analysis

### Audit of existing domains and services

| Area | Package / path | Current capability | Reuse for AI Integrations |
|------|----------------|-------------------|---------------------------|
| Agent entity | `@vassembly/domain-agent` | User-scoped CRUD, soft delete, list filters, GraphQL list | **Blueprint** for domain/service/API/UI stack; extend with `integrationCredentialId` |
| User entity | `@vassembly/domain-user` | Sensitive field storage (`passwordHash`), encode for reset tokens | Pattern for never exposing secrets in DTOs |
| Refresh tokens | `@vassembly/domain-refresh-token` | `encode(token)` for reversible lookup storage | **Primary pattern** for encrypted API key storage |
| Auth orchestration | `@vassembly/service-auth` | `authorizeRequest`, JWT → `userId` | All routes/resolvers |
| Agent service | `@vassembly/service-agent` | Handler orchestration, ownership via `userId` | **Blueprint** for `service-ai-integration` |
| Encryption | `@vassembly/client-encoder` | AES-256-CBC `encode`/`decode` via `config.encoder.secret` | Encrypt API keys at domain write; decrypt only in service test/invoke paths |
| AI client | `@vassembly/client-ai-deepseek` | OpenAI SDK wrapper factory | **Template** for Gemini/ChatGPT/LM Studio clients |
| API gateway | `@vassembly/api` | REST + GraphQL, Mongo index bootstrap | Add routes + resolver |
| UI hooks | `@vassembly/ui-api-hooks` | Agent list (GraphQL) + form validation | New `aiIntegrations/` module |
| Web app | `@vassembly/web` | Agent CRUD pages, settings sections | Management UI + agent form picker |

### What can be reused (~85%)

- Full **agent stack** shape: domain → service → REST/GraphQL → ui-api-hooks → web pages
- **Soft delete / restore** commands and list status filters (active / disabled / archived)
- **Ownership validation** at query, command, service, and route layers (`userId` from JWT only)
- **MongoDB DAO + index registration** via domain export → `initMongoDb({ indexFunctions })`
- **Hybrid API**: GraphQL for list/picker; REST for create/update/delete/restore/test
- **`toXResponse` DTO mappers** that omit secrets
- **Zod validation** at domain commands/queries and API route boundaries

### What must be new (~15%)

| Gap | Placement |
|-----|-----------|
| Per-user integration credential entity | `domains/ai-integration/` |
| Encrypt/decrypt orchestration + connection test | `services/ai-integration/` |
| Provider client wrappers | `packages/client-langchain/` |
| Agent ↔ credential reference | Extend `domains/agent/` |
| Agent count per credential | Service handler querying agent domain |
| Connection test endpoint (greenfield) | Service + REST route |
| Management UI + agent form picker | `apps/web` + `ui/api-hooks` |

### New packages required

| Package | npm name | Justification |
|---------|----------|---------------|
| `domains/ai-integration/` | `@vassembly/domain-ai-integration` | Distinct business entity (user-owned third-party credentials) with own lifecycle |
| `services/ai-integration/` | `@vassembly/service-ai-integration` | Orchestrates domain + provider clients + agent cross-validation |
| `packages/client-langchain/` | `@vassembly/client-langchain` | Unified LangChain-backed provider clients (Gemini, ChatGPT, LM Studio) |

**No new domain for agents** — extend existing `@vassembly/domain-agent` with optional `integrationCredentialId`.

**v1.1 migration note:** Consolidated from separate `@vassembly/client-gemini`, `@vassembly/client-chatgpt`, and `@vassembly/client-lm-studio` packages into unified `@vassembly/client-langchain`. A single package reduces maintenance and complexity. LangChain's `ChatModel` interface enables shared chain/tool infrastructure for future agent execution. Model listing uses provider-native SDKs (LangChain lacks a cross-provider models API).

---

## 1. Architecture Overview

### 1.1 System diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/web                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────────────────────────┐ │
│  │ /settings/ai-integrations │  │ agents/create, agents/[id]/edit         │ │
│  │  IntegrationList        │  │  AgentForm → IntegrationCredentialPicker│ │
│  │  IntegrationForm        │  └──────────────────────────────────────────┘ │
│  │  TestConnectionButton   │                                                 │
│  └──────────┬─────────────┘                                                 │
└─────────────┼───────────────────────────────────────────────────────────────┘
              │ @vassembly/ui-api-hooks (GraphQL list + REST mutations)
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ apps/api (@vassembly/api)                                                    │
│  REST /ai-integrations/*          GraphQL aiIntegrations query               │
│  POST .../test-connection       (list + agentUsageCount for picker)          │
│  authorizeRequest → userId                                                   │
└─────────────┬───────────────────────────────────────────────────────────────┘
              │ @vassembly/service-ai-integration handlers
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ services/ai-integration                                                      │
│  createCredential / updateCredential / deleteCredential / restoreCredential  │
│  listCredentials / getCredential / getCredentialWithAgents                   │
│  testConnection (decrypt → provider client → minimal API call)             │
│  validateCredentialOwnership (shared helper)                                 │
└──────┬──────────────────────────────┬───────────────────────────────────────┘
       │                              │
       ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────────────────────────┐
│ domain-ai-integration│    │ @vassembly/client-langchain                     │
│ encode on write      │    │ createProviderClient() → testConnection()       │
│ queries/commands     │    │ getModels() | invoke() (Gemini, ChatGPT, LM)    │
│ toAiIntegrationResponse (no secrets)│  │ (LangChain ChatModel)                           │
└──────────┬───────────┘    └─────────────────────────────────────────────────┘
           │ MongoDB collection: aiIntegrationCredentials
           ▼
┌──────────────────────┐         ┌──────────────────────┐
│ domain-agent         │◄────────│ agents collection    │
│ integrationCredentialId reference (optional)          │
└──────────────────────┘         └──────────────────────┘
```

### 1.2 Data flow summary

| Flow | Path |
|------|------|
| **Create credential** | Web form → REST POST → service validates + **testConnection** → domain create (encode key) → response DTO |
| **Test before save** | Web form → REST POST `/test-connection` (plaintext key in body, never stored) → service → provider client |
| **List for management** | Web → GraphQL `aiIntegrations` → service list → DTO with `agentUsageCount` |
| **Agent create/edit** | Web picker → GraphQL list (active only) → REST agent create/patch with `integrationCredentialId` → service-agent validates ownership |
| **Runtime invoke (future)** | Agent execution service → get credential by id → decode → provider `invoke()` |

---

## 2. Data Model Specifications

### 2.1 Provider enum

```typescript
export enum AiIntegrationProvider {
  Gemini = 'gemini',
  ChatGPT = 'chatgpt',
  LmStudio = 'lm_studio',
}
```

Constants file: `domains/ai-integration/src/constants.ts`

Provider-specific required fields (validated in service + domain):

| Provider | Required | Optional |
|----------|----------|----------|
| `gemini` | `apiKey` | — |
| `chatgpt` | `apiKey` | `organizationId` |
| `lm_studio` | `baseUrl` | `apiKey` (local installs may omit) |

### 2.2 IntegrationCredential model

**File:** `domains/ai-integration/src/model/model.ts`

```typescript
export enum AiIntegrationStatus {
  Active = 'active',
  Disabled = 'disabled',
  Archived = 'archived',
}

export enum AiIntegrationConnectionStatus {
  Untested = 'untested',
  Connected = 'connected',
  Failed = 'failed',
}

export class AiIntegrationCredentialModel extends Model {
  userId?: string;
  name?: string;
  provider?: AiIntegrationProvider;
  encryptedApiKey?: string;       // encode(apiKey) — never exposed in DTO
  baseUrl?: string | null;        // LM Studio; null for cloud providers
  organizationId?: string | null; // ChatGPT optional
  status?: AiIntegrationStatus;
  connectionStatus?: AiIntegrationConnectionStatus;
  lastTestedAt?: Date | null;
  lastConnectionError?: string | null; // sanitized provider message, no secrets
}
```

Inherited from `@vassembly/model` `Model`: `id`, `createdAt`, `updatedAt`, `removedAt`.

### 2.3 Public response DTO

**File:** `domains/ai-integration/src/model/dto.ts`

```typescript
export interface AiIntegrationCredentialResponse {
  id: string;
  userId: string;
  name: string;
  provider: AiIntegrationProvider;
  baseUrl: string | null;
  organizationId: string | null;
  status: AiIntegrationStatus;
  connectionStatus: AiIntegrationConnectionStatus;
  lastTestedAt: string | null;
  lastConnectionError: string | null;
  hasApiKey: boolean;
  apiKeyHint: string | null;      // last 4 chars only, e.g. "...x7Kp"
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
  agentUsageCount?: number;       // populated by service list/detail handlers only
}
```

**Mapper:** `domains/ai-integration/src/model/toAiIntegrationResponse.ts` — derives `hasApiKey` and `apiKeyHint` from encrypted field without decoding.

### 2.4 Agent model extension

**File:** `domains/agent/src/model/model.ts`

```typescript
integrationCredentialId?: string | null;
```

Validation in `service-agent` create/update:

1. If `integrationCredentialId` provided → fetch credential via `domain-ai-integration.queries.getById({ id, userId })`
2. Credential must exist, belong to user, `status === active`, `removedAt === null`
3. Optional: agent category/provider compatibility rules (future)

**Mongo index on agents:** `{ userId: 1, integrationCredentialId: 1 }` for usage count queries.

### 2.5 Example MongoDB documents

**Active Gemini credential:**

```json
{
  "_id": "674a1b2c3d4e5f6789012345",
  "userId": "674a00000000000000000001",
  "name": "Personal Gemini",
  "provider": "gemini",
  "encryptedApiKey": "a1b2c3d4...:e5f6...",
  "baseUrl": null,
  "organizationId": null,
  "status": "active",
  "connectionStatus": "connected",
  "lastTestedAt": "2026-05-22T10:30:00.000Z",
  "lastConnectionError": null,
  "createdAt": "2026-05-20T08:00:00.000Z",
  "updatedAt": "2026-05-22T10:30:00.000Z",
  "removedAt": null
}
```

**Soft-deleted credential:**

```json
{
  "status": "archived",
  "removedAt": "2026-05-21T14:00:00.000Z",
  "connectionStatus": "connected"
}
```

### 2.6 Status state machines

**Credential lifecycle (`status` + `removedAt`):** Same semantics as agents.

| Filter | Mongo condition |
|--------|-----------------|
| Active (default) | `removedAt` null AND `status === active` |
| Disabled | `removedAt` null AND `status === disabled` |
| Archived | `status === archived` (includes soft-deleted) |
| All | no status/removedAt filter |

**Connection status (`connectionStatus`):** Independent of credential lifecycle.

```
untested ──test success──► connected
    │                         │
    └──test failure──► failed ◄── subsequent test failure
                              │
                    test success ──► connected
```

Updated by:

- `testConnection` handler (always)
- `createCredential` / `updateCredential` when key or connection params change (re-test inline)

---

## 3. Domain Design (`@vassembly/domain-ai-integration`)

### 3.1 Package structure

Mirror `domains/agent/`:

```
domains/ai-integration/
├── src/
│   ├── index.ts
│   ├── constants.ts
│   ├── model/
│   │   ├── model.ts
│   │   ├── factories.ts
│   │   ├── dto.ts
│   │   ├── toAiIntegrationResponse.ts
│   │   ├── graphql.ts
│   │   └── index.ts
│   ├── commands/
│   │   ├── create/
│   │   ├── update/
│   │   ├── removeSoft/
│   │   └── restore/
│   ├── queries/
│   │   ├── getById.ts + getById.types.ts
│   │   ├── getListForUser.ts + getListForUser.types.ts
│   │   └── getListByProvider.ts + getListByProvider.types.ts
│   └── clients/
│       └── mongodb.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### 3.2 Encryption in domain commands

**Create command** (`commands/create/index.ts`):

- Accept plaintext `apiKey` in command input (from service only — never from API route directly to domain without service)
- Before `createDb`: `encryptedApiKey = apiKey ? encode(apiKey) : undefined`
- Strip `apiKey` from persisted document
- Default: `status: active`, `connectionStatus: untested`, `removedAt: null`

**Update command** (`commands/update/index.ts`):

- If `apiKey` in patch → re-encode to `encryptedApiKey`
- Omit `apiKey` from update when not provided (preserve existing key)
- Reset `connectionStatus` to `untested` when key, `baseUrl`, or `organizationId` changes

**Domain does NOT decode** — decryption stays in service layer for test/invoke only.

### 3.3 Commands

| Command | Helper | Notes |
|---------|--------|-------|
| `create` | `createDb` | Zod: userId, name, provider, apiKey?, baseUrl?, organizationId?, status?, connectionStatus?, lastTestedAt?, lastConnectionError? |
| `update` | `updateDb` | Partial; re-encode apiKey if present |
| `removeSoft` | `removeSoftDb` | Sets `status: archived` via `additionalPartial` |
| `restore` | custom | Clears `removedAt`, sets `status: active`; validates ownership via `getById` |

### 3.4 Queries

| Query | Purpose |
|-------|---------|
| `getById` | By id; optional `userId` → `NotFoundError` on mismatch (no leak) |
| `getListForUser` | Paginated list with search (name), status filter — mirror `getListForUser` in agent |
| `getListByProvider` | `userId` + `provider` + active-only — for agent form picker filtered by provider |

**List output:** `{ items: AiIntegrationCredentialModel[], totalCount, page, size }`

### 3.5 GraphQL schema

**File:** `domains/ai-integration/src/model/graphql.ts`

```graphql
enum AiIntegrationProvider { gemini chatgpt lm_studio }
enum AiIntegrationStatus { active disabled archived }
enum AiIntegrationConnectionStatus { untested connected failed }

type AiIntegrationCredential {
  id: ID!
  name: String!
  provider: AiIntegrationProvider!
  baseUrl: String
  organizationId: String
  status: AiIntegrationStatus!
  connectionStatus: AiIntegrationConnectionStatus!
  lastTestedAt: String
  lastConnectionError: String
  hasApiKey: Boolean!
  apiKeyHint: String
  agentUsageCount: Int
  createdAt: String!
  updatedAt: String!
  removedAt: String
}

type AiIntegrationsList {
  items: [AiIntegrationCredential!]!
  totalCount: Int!
  page: Int!
  size: Int!
}

type Query {
  aiIntegrations(page: Int!, size: Int!, search: String, status: String, provider: String): AiIntegrationsList!
}
```

No GraphQL mutations — REST only (consistent with agents).

### 3.6 Domain export

```typescript
export { commands, queries, gqlSchema, mongodbIndexes };
export { AiIntegrationProvider, AiIntegrationStatus, AiIntegrationConnectionStatus, toAiIntegrationResponse };
export type { AiIntegrationCredentialModel, AiIntegrationCredentialResponse };
export type { GetListForUserQueryInput, AiIntegrationListStatusFilter } from './queries/getListForUser.types';
```

---

## 4. Service Design (`@vassembly/service-ai-integration`)

### 4.1 Handlers

| Handler | Input | Output | Dependencies |
|---------|-------|--------|--------------|
| `createCredential` | `{ userId, body }` | `{ credential: AiIntegrationCredentialResponse }` | testConnection inline → domain create |
| `updateCredential` | `{ userId, credentialId, body }` | `{ credential }` | ownership check; re-test if connection fields change |
| `deleteCredential` | `{ userId, credentialId }` | `{ success, message }` | `removeSoft`; block if agents still reference? (see §4.3) |
| `restoreCredential` | `{ userId, credentialId }` | `{ credential }` | mirror agent restore |
| `listCredentials` | `{ userId, page, size, search?, status?, provider? }` | `{ items, totalCount, page, size }` | list query + agent count aggregation |
| `getCredential` | `{ userId, credentialId }` | `{ credential }` | getById + agent count |
| `getCredentialWithAgents` | `{ userId, credentialId }` | `{ credential, agents: AgentResponse[] }` | getById + agent list by credentialId |
| `testConnection` | `{ userId?, body }` | `{ success, connectionStatus, models?, error? }` | provider client; optional saved credential id |

### 4.2 `testConnection` orchestration

**Two modes:**

1. **Ephemeral (pre-save):** Body contains `provider`, `apiKey`, `baseUrl?`, `organizationId?` — no DB read. Used by form "Test connection" button before create/update.
2. **Saved credential:** Body contains `credentialId` — service loads, verifies ownership, decodes key, tests.

**Flow:**

```
1. Validate provider + required fields (Zod in handler types)
2. Resolve credentials (from body or decode from DB)
3. createProviderClient({ provider, apiKey, baseUrl, organizationId })
4. await client.testConnection()
   └── internally: getModels() or minimal chat/ping call
5. Map provider errors → WrongParamError (user-facing) or InternalError (logged)
6. If saved credential mode: update connectionStatus, lastTestedAt, lastConnectionError via domain update
7. Return { success: true, connectionStatus: 'connected', models?: string[] }
```

**Create/update policy:** `createCredential` and `updateCredential` **must call testConnection internally** and reject save if test fails (`WrongParamError: "Connection test failed: …"`). Matches requirement "connection testing before saving."

### 4.3 Delete guard

When `agentUsageCount > 0`:

- **Soft delete allowed** — agents keep reference; UI shows warning "Used by N agents"
- **Optional strict mode:** reject delete with `WrongParamError` if count > 0 — recommend **allow with warning** for full-featured UX (user can reassign agents first)

### 4.4 Agent usage count

**File:** `services/ai-integration/src/helpers/getAgentUsageCount.ts`

```typescript
// Query agent domain: count or list where integrationCredentialId = credentialId AND userId = userId
```

Implement via new agent query `getCountByIntegrationCredentialId` or reuse `getListForUser` with filter — prefer **dedicated lightweight count query** in agent domain:

`domains/agent/src/queries/getCountByIntegrationCredentialId.ts`

### 4.5 Provider client factory

**File:** `services/ai-integration/src/providers/createProviderClient.ts`

```typescript
const PROVIDER_CLIENT_MAP: Record<AiIntegrationProvider, (params) => AiProviderClient> = {
  [AiIntegrationProvider.Gemini]: GeminiClient,
  [AiIntegrationProvider.ChatGPT]: ChatgptClient,
  [AiIntegrationProvider.LmStudio]: LmStudioClient,
};
```

### 4.6 Cross-domain validation (agent service extension)

**Files:** `services/agent/src/handlers/createAgent/index.ts`, `updateAgent/index.ts`

Add:

```typescript
if (body.integrationCredentialId) {
  await aiIntegrationDomain.queries.getById({
    id: body.integrationCredentialId,
    userId,
  });
  // Optionally verify connectionStatus === 'connected'
}
```

---

## 5. API Design (`apps/api`)

### 5.1 REST routes

**Prefix:** `/ai-integrations`  
**Directory:** `apps/api/src/routes/ai-integrations/`

| File | Method | Path | Body / query | Handler |
|------|--------|------|--------------|---------|
| `create.ts` | POST | `/` | `aiIntegrationCreateBodySchema` | `createCredential` |
| `list.ts` | GET | `/` | `page`, `size`, `search?`, `status?`, `provider?` | `listCredentials` |
| `getById.ts` | GET | `/:id` | — | `getCredentialWithAgents` or `getCredential` |
| `update.ts` | PATCH | `/:id` | `aiIntegrationPatchBodySchema.strict()` | `updateCredential` |
| `delete.ts` | DELETE | `/:id` | — | `deleteCredential` |
| `restore.ts` | POST | `/:id/restore` | — | `restoreCredential` |
| `testConnection.ts` | POST | `/test-connection` | `testConnectionBodySchema` | `testConnection` |

**Route pattern** (mirror agents):

```typescript
handler: async ({ body, headers, params }) => {
  const { userId } = await authHandlers.authorizeRequest({ headers });
  return aiIntegrationService.createCredential({ userId, body });
}
```

### 5.2 Zod schemas (API layer)

**Create body:**

```typescript
z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(['gemini', 'chatgpt', 'lm_studio']),
  apiKey: z.string().min(1).max(500).optional(),
  baseUrl: z.string().url().max(500).optional().nullable(),
  organizationId: z.string().max(100).optional().nullable(),
}).superRefine(/* provider-specific required fields */);
```

**Test connection body:**

```typescript
z.object({
  credentialId: z.string().optional(),
  provider: z.enum([...]).optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional().nullable(),
  organizationId: z.string().optional().nullable(),
}).superRefine(/* require credentialId XOR provider+fields */);
```

**Never log request bodies** containing `apiKey`.

### 5.3 GraphQL

**Resolver:** `apps/api/src/graphql/resolvers/aiIntegration.ts`

- Query `aiIntegrations` → `listCredentials` with auth context `userId`
- Register in `apps/api/src/graphql/index.ts`
- Import schema from `@vassembly/domain-ai-integration`

### 5.4 Wire-up

**File:** `apps/api/src/routes/index.ts`

```typescript
import { mongodbIndexes as aiIntegrationMongodbIndexes } from '@vassembly/domain-ai-integration';

const aiIntegrationRoutes = routesWithPrefix('/ai-integrations', [
  aiIntegrationCreateRoute,
  aiIntegrationListRoute,
  // ...
]);

await initMongoDb({
  indexFunctions: [userMongodbIndexes, agentMongodbIndexes, aiIntegrationMongodbIndexes],
});
```

### 5.5 Error mapping

| Error | HTTP | When |
|-------|------|------|
| `ValidationError` | 400 | Zod / domain schema |
| `WrongParamError` | 400 | Failed connection test, invalid provider fields |
| `NotFoundError` | 404 | Credential not found or wrong owner |
| `UnauthorizedError` | 401 | Missing/invalid JWT |
| `InternalError` | 500 | Provider outage, unexpected failures |

---

## 6. Client Interface Design

### 6.1 Shared interface (service layer)

**File:** `services/ai-integration/src/providers/types.ts`

```typescript
export interface AiProviderClientParams {
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
}

export interface AiProviderTestResult {
  success: boolean;
  models?: string[];
  errorMessage?: string;
}

export interface AiProviderInvokeParams {
  systemMessage?: string;
  userMessage: string;
  model?: string;
}

export interface AiProviderInvokeResult {
  message: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export interface AiProviderClient {
  testConnection: () => Promise<AiProviderTestResult>;
  getModels: () => Promise<string[]>;
  invoke: (params: AiProviderInvokeParams) => Promise<AiProviderInvokeResult>;
}
```

### 6.2 Package implementations

**Package:** `@vassembly/client-langchain` (`packages/client-langchain/`)

Unified factory and provider modules backed by LangChain chat models:

```
packages/client-langchain/
├── src/
│   ├── index.ts
│   ├── createProviderClient.ts   # createProviderClient({ provider, ... }) => AiProviderClient
│   ├── types.ts
│   ├── providers/
│   │   ├── createGeminiProvider.ts    # ChatGoogleGenerativeAI
│   │   ├── createChatGptProvider.ts   # ChatOpenAI
│   │   └── createLmStudioProvider.ts  # ChatOpenAI (custom baseURL)
│   ├── operations/
│   │   ├── testConnection.ts
│   │   ├── getModels.ts
│   │   └── invokeWithChatModel.ts
│   └── modelListing/             # Provider-native SDK model discovery
│       ├── listOpenAiModels.ts
│       └── listGeminiModels.ts
├── package.json
└── vitest.config.ts
```

| Provider | LangChain class | Model listing | `testConnection` implementation |
|----------|-----------------|---------------|--------------------------------|
| `gemini` | `ChatGoogleGenerativeAI` | Google GenAI SDK | List models via native SDK |
| `chatgpt` | `ChatOpenAI` | OpenAI SDK | `models.list()` via native SDK |
| `lm_studio` | `ChatOpenAI` (custom `baseURL`) | OpenAI-compatible `GET /v1/models` | List models against local server |

Invoke and connection verification use LangChain; model listing uses provider-native SDKs because LangChain does not expose a cross-provider models API.

**Error handling:** Wrap provider errors in `InternalError` with `CONSOLE_LOG_PREFIX`; service maps known auth/URL errors to `WrongParamError` with safe messages ("Invalid API key", "Cannot reach server at …").

### 6.3 Extensibility

Adding a provider:

1. Add enum value + validation rules
2. Add provider module in `packages/client-langchain/src/providers/` and model listing if needed
3. Register in `packages/client-langchain/src/createProviderClient.ts`
4. Add UI provider option in form constants

No domain schema migration required beyond enum extension if fields fit existing model.

---

## 7. UI Architecture

### 7.1 API hooks (`ui/api-hooks/src/aiIntegrations/`)

| File | Purpose |
|------|---------|
| `types.ts` | `AiIntegrationDto`, form values, list response types |
| `constants.ts` | Provider labels, max lengths, field visibility per provider |
| `useAiIntegrations.ts` | GraphQL lazy query (list) |
| `listAiIntegrationsQuery.ts` | GraphQL query string |
| `mapAiIntegrationsListData.ts` | GraphQL → DTO |
| `useAiIntegrationForm.ts` | Zod validation, provider-conditional fields |
| `useCreateAiIntegration.ts` | REST POST via `useHttpMutation` |
| `useUpdateAiIntegration.ts` | REST PATCH |
| `useDeleteAiIntegration.ts` | REST DELETE |
| `useRestoreAiIntegration.ts` | REST POST restore |
| `useTestAiIntegrationConnection.ts` | REST POST test-connection |
| `index.ts` | Public exports |

Export from `ui/api-hooks/src/index.ts`.

### 7.2 Web pages

**Recommended placement:** Settings subsection (aligns with user-settings pattern)

| Route | File | Purpose |
|-------|------|---------|
| `/settings/ai-integrations` | `apps/web/app/settings/ai-integrations/page.tsx` | List + manage |
| `/settings/ai-integrations/create` | `.../create/page.tsx` | Create form |
| `/settings/ai-integrations/[id]/edit` | `.../[id]/edit/page.tsx` | Edit form |

**Components** (`apps/web/app/settings/ai-integrations/_components/`):

| Component | Role |
|-----------|------|
| `AiIntegrationList.tsx` | Table: name, provider, connection status badge, agent count, actions |
| `AiIntegrationForm.tsx` | Name, provider select, conditional fields, test button, save |
| `AiIntegrationDeleteDialog.tsx` | Warn if `agentUsageCount > 0` |
| `AiIntegrationRestoreDialog.tsx` | Restore archived |
| `ConnectionStatusBadge.tsx` | Visual: connected / failed / untested |
| `useAiIntegrationList.ts` | List state, filters, delete/restore |
| `IntegrationCredentialPicker.tsx` | Select for agent form |

**Settings nav:** Add anchor in `apps/web/app/settings/sectionAnchors.ts` and link from `settingsAuthenticatedView.tsx`.

### 7.3 Agent form integration

**Files to modify:**

| File | Change |
|------|--------|
| `ui/api-hooks/src/agents/types.ts` | Add `integrationCredentialId` to `AgentDto`, `AgentFormValues` |
| `ui/api-hooks/src/agents/useAgentForm.ts` | Optional field validation |
| `apps/web/app/agents/_components/AgentForm.tsx` | `IntegrationCredentialPicker` — filters active + connected credentials |
| `apps/web/app/agents/create/useAgentCreatePage.ts` | Include in POST body |
| `apps/web/app/agents/[id]/edit/useAgentEditPage.ts` | Include in PATCH body |

**Picker behavior:**

- Load via `useAiIntegrations({ status: 'active' })`
- Show only `connectionStatus === 'connected'`
- Display: `{name} ({provider})`
- Allow "None" / clear selection
- Link to settings page to add new integration

### 7.4 Form UX flow

```
1. User selects provider → show provider-specific fields
2. User enters credentials → clicks "Test connection"
   └── useTestAiIntegrationConnection (ephemeral, no save)
3. On success → enable Save (or auto-save)
4. Save → POST create (server re-tests) → redirect to list
5. List shows connection badge + agent usage count
```

---

## 8. Security Model

### 8.1 Encryption strategy

| Stage | Action |
|-------|--------|
| **Write (domain create/update)** | `encryptedApiKey = encode(plaintextApiKey)` via `@vassembly/client-encoder` |
| **Read (service test/invoke only)** | `decode(encryptedApiKey)` in service handler — never in domain DTO mappers |
| **API responses** | Never include plaintext or encrypted key; only `hasApiKey`, `apiKeyHint` |
| **Logs** | Never log `apiKey`, `encryptedApiKey`, or request bodies with keys |
| **GraphQL** | Same DTO rules — no secret fields on type |

**Key management:** Uses existing `config.encoder.secret` and `config.encoder.algorithm` (`aes-256-cbc`). No per-credential key rotation in v1 — rotating app secret requires re-encryption migration (document as operational runbook, out of v1 scope).

### 8.2 Access control

Defense in depth (same as agents):

1. **API:** `authorizeRequest` → `userId` from JWT
2. **Service:** Pass `userId` to all domain calls; never accept `userId` from request body
3. **Domain queries/commands:** `getById({ id, userId })` → `NotFoundError` on mismatch
4. **Agent cross-reference:** Service-agent validates credential ownership before linking

### 8.3 Sensitive data masking

- `apiKeyHint`: last 4 characters prefixed with `...`
- `hasApiKey: false` when no key stored (LM Studio local without key)
- `lastConnectionError`: strip patterns matching keys/ tokens before persist

### 8.4 Audit logging

No dedicated audit domain in v1. Use structured application logging:

| Event | Log level | Fields (no secrets) |
|-------|-----------|---------------------|
| Credential created | info | `userId`, `credentialId`, `provider` |
| Credential updated | info | `userId`, `credentialId`, `fieldsChanged: string[]` |
| Credential deleted/restored | info | `userId`, `credentialId`, `action` |
| Connection test failed | warn | `userId`, `credentialId?`, `provider`, `errorCode` |
| Connection test succeeded | info | `userId`, `credentialId?`, `provider` |

Implement via `@vassembly/logger` in service handlers when logger usage is established in services (follow first service to add it).

### 8.5 Transport

- HTTPS only in production
- JWT required for all endpoints
- `test-connection` with ephemeral key: treat as sensitive as login — no caching headers

---

## 9. Database Design

### 9.1 Collection

**Name:** `aiIntegrationCredentials`  
**DAO:** `aiIntegrationMongodbDao` in `domains/ai-integration/src/clients/mongodb.ts`

### 9.2 Indexes

```typescript
await collection.createIndex({ userId: 1 });
await collection.createIndex({ userId: 1, status: 1 });
await collection.createIndex({ userId: 1, provider: 1 });
await collection.createIndex({ userId: 1, provider: 1, status: 1 });
await collection.createIndex({ createdAt: -1 });
await collection.createIndex({ name: 'text' });
```

### 9.3 Relationships

```
users (1) ──< aiIntegrationCredentials (N)     [userId]
aiIntegrationCredentials (1) ──< agents (N)   [integrationCredentialId, optional]
```

**Agent usage query:**

```javascript
db.agents.countDocuments({
  userId: ObjectId("..."),
  integrationCredentialId: ObjectId("..."),
  removedAt: null,
})
```

### 9.4 Data lifecycle

| Action | DB effect |
|--------|-----------|
| Create | Insert with `status: active`, `connectionStatus: untested` → updated to `connected` after test |
| Soft delete | `removedAt` set, `status: archived` |
| Restore | `removedAt: null`, `status: active` |
| Hard delete | Not exposed in UI v1; optional admin-only `remove` command later |
| Agent unlink on credential delete | Not automatic — agents retain stale id; getAgent shows missing credential gracefully |

---

## 10. Implementation Plan

### 10.1 Phases

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| **P1 — Foundation** | `@vassembly/client-langchain` + provider interface | Unified client with unit tests; `testConnection` + `getModels` for all three providers |
| **P2 — Domain** | `@vassembly/domain-ai-integration` | Model, commands, queries, indexes, GraphQL schema, domain tests |
| **P3 — Service** | `@vassembly/service-ai-integration` | All handlers including testConnection; service tests |
| **P4 — API** | `apps/api` routes + GraphQL resolver | Wire-up, index registration, route tests |
| **P5 — Agent extension** | `domain-agent` + `service-agent` | `integrationCredentialId` + validation + count query |
| **P6 — UI hooks** | `ui/api-hooks/src/aiIntegrations/` | All hooks + types |
| **P7 — Management UI** | Settings pages | Full CRUD + test + list with agent count |
| **P8 — Agent form** | Agent create/edit picker | End-to-end linking |

**Dependency graph:** P1 → P3; P2 → P3 → P4 → P6 → P7; P5 can parallel P4 after P2; P8 after P6 + P5.

### 10.2 Todo Plan

1. **`packages/client-langchain`** — [Type: new client package]
   - Changes: Unified LangChain-backed factory (`createProviderClient`) implementing `AiProviderClient` for Gemini, ChatGPT, and LM Studio; `testConnection`, `getModels`, `invoke`; model listing via provider-native SDKs
   - Files: `src/createProviderClient.ts`, `src/providers/*`, `src/operations/*`, `src/modelListing/*`, `src/types.ts`, `src/index.ts`, colocated tests, `package.json`
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2) → Done
   - Dependencies: None

2. **`domains/ai-integration`** — [Type: new domain]
   - Changes: Full domain per §3; encryption in create/update; GraphQL schema; indexes
   - Files: full domain tree per agent template
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer
   - Dependencies: None (encoder is existing package)

3. **`services/ai-integration`** — [Type: new service]
   - Changes: All handlers per §4; provider factory via `@vassembly/client-langchain`; decode only here
   - Files: `src/handlers/*`, `src/providers/*`, `src/helpers/getAgentUsageCount.ts`
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer
   - Dependencies: Todo 1–2

4. **`domains/agent`** — [Type: extend existing domain]
   - Changes: Add `integrationCredentialId`; extend create/update schemas, GraphQL, DTO; add `getCountByIntegrationCredentialId` query
   - Files: `src/model/*`, `src/commands/create/*`, `src/commands/update/*`, `src/queries/getCountByIntegrationCredentialId.ts`
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2)
   - Dependencies: Todo 2

5. **`services/agent`** — [Type: extend existing service]
   - Changes: Validate `integrationCredentialId` on create/update
   - Files: `src/handlers/createAgent/*`, `src/handlers/updateAgent/*`
   - Workflow: unit-test-writer → coder ↔ code-reviewer (max 2)
   - Dependencies: Todo 2, 4

6. **`apps/api`** — [Type: extend existing app]
   - Changes: REST routes, GraphQL resolver, index registration
   - Files: `src/routes/ai-integrations/*`, `src/graphql/resolvers/aiIntegration.ts`, `src/routes/index.ts`, `src/graphql/index.ts`
   - Workflow: coder ↔ code-reviewer (max 2)
   - Dependencies: Todo 3

7. **`ui/api-hooks`** — [Type: extend existing package]
   - Changes: Full `aiIntegrations/` module; extend agent types
   - Files: `src/aiIntegrations/*`, `src/agents/types.ts`, `src/index.ts`
   - Workflow: coder ↔ code-reviewer (max 2)
   - Dependencies: Todo 6

8. **`apps/web`** — [Type: extend existing app]
    - Changes: Settings AI integrations pages; agent form picker; settings nav
    - Files: `app/settings/ai-integrations/**`, `app/agents/_components/AgentForm.tsx`, settings nav files
    - Workflow: ui-designer (tokens/layout) → coder ↔ code-reviewer (max 2)
    - Dependencies: Todo 7, 5

---

## 11. Testing Strategy

### 11.1 Unit tests by layer

| Layer | Approach | Mock boundary |
|-------|----------|---------------|
| **Client packages** | Mock provider HTTP/SDK | External API |
| **Domain commands/queries** | Black-box input/output | MongoDB DAO |
| **Service handlers** | Black-box | Domain + provider client factory |
| **API routes** | Request/response schema + handler invocation | Service handlers |
| **UI hooks** | Render hook with mocked Apollo/HTTP | Network |

### 11.2 Critical test cases

**Domain:**

- Create encodes apiKey; response mapper never exposes it
- getById with wrong userId → NotFoundError
- List status filters match agent semantics
- Update with new apiKey re-encodes and resets connectionStatus

**Service:**

- testConnection ephemeral success/failure
- createCredential rejects when test fails
- getCredential includes correct agentUsageCount
- decode never appears in return value

**Agent integration:**

- createAgent with invalid credentialId → NotFoundError
- createAgent with another user's credential → NotFoundError

**Clients:**

- testConnection maps 401 → retriable error message
- LM Studio requires baseUrl

### 11.3 Integration testing

- API + in-memory/mongo test container: full create flow with mocked provider
- GraphQL list returns masked DTO

### 11.4 Manual testing checklist

- [ ] Create Gemini integration: test → save → appears in list as connected
- [ ] Create with invalid key: test fails, save blocked
- [ ] Edit integration: change key → re-test required
- [ ] Soft delete integration used by agent: warning shown, agent retains reference
- [ ] Restore archived integration
- [ ] Agent create: pick credential → save → edit shows selection
- [ ] List filters: active / disabled / archived
- [ ] LM Studio with local URL only (no apiKey)
- [ ] API responses never contain apiKey fields
- [ ] Unauthorized access returns 401

### 11.5 Definition of feature complete

- All three providers supported end-to-end
- Credentials encrypted at rest; never returned in API/UI
- Connection test required before save
- Management UI with status, agent usage count, CRUD, restore
- Agent create/edit links credential with ownership validation
- Unit tests pass at domain, service, client layers
- Mongo indexes registered on API startup
- README updated for new domain, service, and client packages

---

## 12. Deployment Considerations

### 12.1 Configuration

| Config key | Purpose | Required |
|------------|---------|----------|
| `config.encoder.secret` | AES key for credential encryption | Yes (existing) |
| `config.encoder.algorithm` | Cipher algorithm | Yes (existing) |
| `config.services.api.port` | API port | Yes (existing) |
| MongoDB connection | Same cluster as agents | Yes (existing) |

**No new env vars for provider API keys** — per-user keys stored in MongoDB, not app config. Deprecate reliance on global `config.deepSeekAi` for user-facing flows.

### 12.2 MongoDB setup

- Same database as existing collections
- Indexes created automatically via `initMongoDb` on API startup
- No sharding requirements for v1

### 12.3 Deploy order

1. Deploy API with new routes (backward compatible)
2. Deploy web with settings UI + agent picker
3. No migration script required for agents (`integrationCredentialId` optional, defaults null)

### 12.4 Operational runbook notes

- **Encoder secret rotation:** Requires batch re-encrypt job (future script in `domains/ai-integration/scripts/`)
- **Provider outage:** Connection tests fail with `WrongParamError`; existing saved credentials show `connectionStatus: failed`
- **Rate limits:** testConnection should debounce in UI; consider server-side rate limit per userId (future)

---

## Recommendation

**Most conservative approach:** Clone the agent vertical slice verbatim for `ai-integration`, add encryption at the domain write boundary (copying refresh-token `encode` pattern), implement provider clients from `client-ai-deepseek` template, and extend agent with a single optional foreign key. Connection testing lives exclusively in the service layer as new orchestration — the only genuinely novel business flow.

**Trade-offs:**

| Decision | Choice | Alternative rejected |
|----------|--------|---------------------|
| API key storage | Reversible `encode` | Hash (cannot invoke APIs) |
| Test before save | Server-side mandatory on create/update | Client-only test (insecure) |
| GraphQL vs REST | Hybrid (same as agents) | GraphQL-only mutations |
| Delete with agents | Allow with warning | Block delete ( poorer UX ) |
| UI placement | Settings subsection | Top-level `/integrations` (more nav churn) |
| Provider clients | Unified `@vassembly/client-langchain` (v1.1) | Separate per-provider packages (higher maintenance) |

This approach minimizes new architectural concepts, keeps secrets out of responses by default, and leaves a clear path for future agent execution (`invoke()` already on client interface).

---

## Addendum (2026-07-30): Switch System Agent Connection Preference from the AI Integrations UI

**Status:** Ready for implementation — UI-only, no backend changes required.
**Feature request:** Let users change which AI integration powers platform/system agents directly from the AI Integrations list or the integration edit page, instead of only via the (currently unimplemented) Settings `#ai-connections` section referenced in [`docs/features/system-agent/design.md`](../system-agent/design.md).

### Analysis

**What already exists (fully reusable, ~100%):**

| Layer | Asset | Reuse |
|-------|-------|-------|
| Domain | `@vassembly/domain-system-agent` — `preferenceModel.ts`, `commands.upsertPreference`, `queries.getPreferenceByUserId` | No change |
| Service | `services/agent/src/handlers/getConnectionPreference`, `setConnectionPreference` — validates credential is owned, `status: active`, `connectionStatus: connected` | No change |
| API | REST `GET/PUT /system-agents/connection-preference` (user auth via `authorizeRequest`) | No change |
| UI hooks | `ui/api-hooks/src/systemAgents/useSystemAgentPreference.ts` → `useSystemAgentPreference()` (GET) and `useUpsertSystemAgentPreference()` (PUT), already exported from `@vassembly/ui-api-hooks` | No change |
| Cross-cutting guards | `createCredential` auto-sets preference on first credential (`isFirstSystemAgentPreference`); `deleteCredential` blocks delete with `ConflictError` when the credential is the active preference | No change |
| UI patterns | `ConnectionStatusBadge`, `AiIntegrationStatusBadge`, `AgentUsageBadge` (Tag/Text badges with variant maps), `useAiIntegrationList.ts` (testingCredentialId busy-state pattern), `tableColumns.tsx` (action column), `DeleteDialog.tsx` (warning copy pattern) | Clone pattern, not code |

**What's missing (the actual gap — UI only):**

1. No visual indicator on the list or edit page showing *which* credential currently powers system agents.
2. No action to set/change the preference from either surface — today the create-flow toast says "You can change this in Settings," but `/settings#ai-connections` is stub/unmounted, so users have no way to change their mind after the first integration.
3. `deleteCredential`'s `ConflictError` message is thrown by the API but the list's `handleDelete` in `useAiIntegrationList.ts` swallows it behind a generic `"Failed to delete integration"` snackbar — the specific, actionable backend message never reaches the user.

**No new domain, service, route, or GraphQL work is needed.** This is a pure `apps/web` UI addition composing two already-exported hooks. Confirms the PRD/design's Phase 3 backend was already fully delivered; only the "Phase 2 Settings UI" front-end was never built, and the request now redirects that UI surface to `/agents` instead.

### UX Placement Decision: Both list and edit page

| Option | Verdict | Rationale |
|--------|---------|-----------|
| List page only | Partial | List is the natural place to *compare* connections at a glance (like a radio group) and switch in one click without navigating away — matches the "only one connection used at a time" mental model from `design.md` §3.4. |
| Edit/detail page only | Partial | Users already reviewing one integration's details expect to see/change its system-agent role inline, without going back to the list. |
| **Both (recommended)** | ✅ | Same shared hook/logic, presentational components differ only in layout. Marginal cost is one extra hook consumer + two small components, not duplicated business logic. Matches how `ConnectionStatusBadge` and `AiIntegrationStatusBadge` are already reused across both surfaces implicitly (list shows them; edit page could too). |

**Decision:** Implement on **both** — list (primary, since users compare across all integrations) and edit page (secondary, contextual convenience) — sharing one Facade hook so there is a single source of truth for the "set as system connection" action.

### Design Patterns Applied

- **Facade** (`services/agent/src/handlers/*` already fascades domain calls; mirrored on the frontend): introduce `useSystemAgentPreferenceStatus` + `useSetSystemAgentPreference` as a small facade over the existing `useSystemAgentPreference()` / `useUpsertSystemAgentPreference()` hooks, hiding refetch/snackbar/busy-state orchestration behind one API consumed identically by the list and the edit page — avoids duplicating that orchestration in two components.
- **Strategy (map object)**: `SystemAgentPreferenceBadge` renders label/variant via a state → `{ label, tagVariant }` map, following the exact pattern already used in `ConnectionStatusBadge.tsx` and `AiIntegrationStatusBadge.tsx` (`CONNECTION_VARIANT_MAP`, `CONNECTION_LABEL_MAP`).
- **Observer** (implicit via hook re-fetch): after a successful `PUT`, the facade hook triggers `useSystemAgentPreference().fetch()` again so all badge/action consumers on the page re-render with the new current-preference id — same pattern `useAiIntegrationList.ts` already uses (`refreshList()` after delete/restore/test).

### API & Convention Notes (doc drift)

- `useSystemAgentPreference` GET already uses **REST**, not GraphQL, which technically deviates from `api-calling-conventions.mdc` ("GraphQL for Data Retrieval"). This was decided in the existing System Agents backend (`docs/features/system-agent/architecture.md` §6.1) prior to this feature and is **out of scope to change here** — flipping it to GraphQL would require a new resolver + schema type purely to satisfy convention, with no user-facing benefit, and risks regressing the already-shipped Settings/Invoke-modal consumers of the same hook. **Recommendation:** leave as-is; track as separate tech-debt cleanup if/when the preference domain gets additional query needs.
- **Route drift resolution:** `docs/features/system-agent/design.md` and `docs/features/system-agent/architecture.md` describe the canonical control surface as `/settings#ai-connections` (Settings page), but that Settings section was never implemented (stub/unmounted) and the codebase's actual, shipped surface is `/agents#ai-integrations` (list) and `/agents/ai-integrations/[id]/edit` (edit). This addendum **supersedes** the Settings-only placement for those two docs: the canonical, currently-supported UI for changing the system-agent connection is the AI Integrations list/edit pages documented here. If Settings `#ai-connections` is built later, it should call the same `useSystemAgentPreference` / `useUpsertSystemAgentPreference` hooks and can simply link out from `IntegrationCredentialPicker`'s existing `manageHref` pattern — no conflict, just an additional entry point.
- No changes needed to `packages/constants/src/specialization.ts` or `config.platformAi` — this addendum only affects user-credential preference used by `getConnectionPreference`/`setConnectionPreference`/`invokeSystemAgent`, which is orthogonal to platform-wide AI config.

### UX Flows

**Flow 1 — Set preference from the list**

```mermaid
flowchart TD
  A[List loads] --> B[GET /system-agents/connection-preference]
  B --> C{Preference exists?}
  C -->|No 404| D[No row shows "Current"; all eligible rows show "Set as system connection"]
  C -->|Yes| E[Row matching integrationCredentialId shows "Current" badge; others show action button]
  E --> F[User clicks "Set as system connection" on row X]
  F --> G{Row X eligible? status=active & connectionStatus=connected}
  G -->|No| H[Button disabled with tooltip — unreachable via click]
  G -->|Yes| I[PUT /system-agents/connection-preference credentialId=X]
  I -->|200| J[Snackbar: "System agent connection updated"; refetch preference; badge moves to row X]
  I -->|422/404 error| K[Snackbar: error message from API]
```

**Flow 2 — Set/verify preference from the edit page**

```mermaid
flowchart TD
  A[Edit page loads credential] --> B[GET /system-agents/connection-preference in parallel]
  B --> C{This credential is current preference?}
  C -->|Yes| D[Show "Current system agent connection" badge, action disabled]
  C -->|No| E{Credential active & connected?}
  E -->|Yes| F[Show "Set as system connection" button]
  E -->|No| G[Show disabled button + helper: "Test the connection and ensure it's active first"]
  F --> H[Click → PUT preference] --> I[Snackbar success; badge flips to "Current"]
```

**Flow 3 — Delete guard message (edge-case fix bundled with this feature)**

```mermaid
flowchart TD
  A[User clicks Delete on the current-preference credential] --> B[DELETE /ai-integrations/:id]
  B --> C[Service throws ConflictError: "Cannot delete this credential because it powers system agents..."]
  C --> D[handleDelete catches error via getRequestErrorMessage, shows it in snackbar instead of generic text]
```

### File-Level Implementation Steps (all in `apps/web`, UI-only)

1. **Shared facade hooks** — new folder `apps/web/app/agents/_components/ai-integrations/_components/shared/`:
   - `useSystemAgentPreferenceStatus.ts` — thin wrapper over `useSystemAgentPreference()`; exposes `{ currentCredentialId: string | undefined, isLoading, refetch }`; treats a 404/`NotFoundError` response as `currentCredentialId: undefined` (no error surfaced to UI — "no preference set yet" is a valid state, matching `getConnectionPreference`'s documented 404 behavior).
   - `useSetSystemAgentPreference.ts` — thin wrapper over `useUpsertSystemAgentPreference()`; exposes `{ setPreference: (credentialId: string) => Promise<void>, isSaving: boolean, savingCredentialId: string | null }`; on success calls a passed-in `onSuccess` (used to trigger `refetch`) and shows the snackbar; on failure shows `getRequestErrorMessage(error, 'Failed to update system agent connection')` (mirrors `handleTestConnection`'s try/catch pattern in `useAiIntegrationList.ts`).
   - `types.ts` — `SystemAgentPreferenceEligibility` type/params per `code-rules-general.mdc` (types.ts colocation rule).
   - `index.ts` — public exports only.

2. **Presentational components** — same `shared/` folder:
   - `SystemAgentPreferenceBadge.tsx` — Tag (`variant="primary"` tonal) with text "Current connection" when `credential.id === currentCredentialId`; renders nothing otherwise. Mirrors `ConnectionStatusBadge.tsx` structure (map-based label/variant, though here it's boolean so a simple conditional suffices — no map needed, avoiding over-engineering per `software-design-patterns.mdc` §Anti-patterns).
   - `SystemAgentPreferenceAction.tsx` — `Button` (`variant="text"`, `size="small"`) labeled "Set as system connection"; `isDisabled` when `status !== 'active' || connectionStatus !== 'connected'` (tooltip/helper text: "Test the connection and ensure it's active first"); `isLoading` when `savingCredentialId === credential.id`; hidden entirely (render `null`) when this row is already the current preference (badge shown instead, per Flow 1/2).
   - `styles.module.scss` — reuse existing `Tag`/`Button` tokens; no new design tokens needed.

3. **List integration** — `apps/web/app/agents/_components/ai-integrations/_components/AiIntegrationsList/`:
   - `useAiIntegrationList.ts`: compose `useSystemAgentPreferenceStatus()` and `useSetSystemAgentPreference({ onSuccess: refetchPreference })`; expose `currentPreferenceCredentialId`, `handleSetSystemAgentPreference`, `settingPreferenceCredentialId` from the hook's return object (same shape convention as `testingCredentialId`/`handleTestConnection`).
     - **Bundled fix:** wrap `deleteCredential` call in `handleDelete` in try/catch, using `getRequestErrorMessage(error, 'Failed to delete integration')` for the snackbar message instead of the current hardcoded string, so the `ConflictError` ("Cannot delete this credential because it powers system agents…") reaches the user (addresses edge case in Flow 3).
   - `tableColumns.tsx`: extend the existing `statusAndConnection` cell (or add adjacent `systemAgentPreference` column) to render `<SystemAgentPreferenceBadge />` + `<SystemAgentPreferenceAction />` side by side; extend `GetAiIntegrationListTableColumnsArgs` with `currentPreferenceCredentialId`, `onSetSystemAgentPreference`, `settingPreferenceCredentialId`.
   - `AiIntegrationsList.tsx`: pass the three new props from `catalog` into `getAiIntegrationListTableColumns(...)` (same pattern as existing `testingCredentialId`).

4. **Edit page integration** — `apps/web/app/agents/ai-integrations/[id]/edit/`:
   - `useAiIntegrationEditPage.tsx`: compose the same two shared hooks; expose `isCurrentSystemAgentConnection`, `canSetAsSystemAgentConnection`, `handleSetSystemAgentPreference`, `isSettingSystemAgentPreference`.
   - `AiIntegrationEditPage.tsx`: render `SystemAgentPreferenceBadge` / `SystemAgentPreferenceAction` directly under the "Current key hint" `Text`, above `AiIntegrationForm`.

5. **No changes required** to `ui/api-hooks`, `services/agent`, `domains/system-agent`, or `apps/api` — all consumed hooks/endpoints already exist and are exported.

### Testing Strategy

| Test | Location | Focus |
|------|----------|-------|
| Unit — `useSystemAgentPreferenceStatus.test.ts` | `shared/` | Maps 404/no-preference to `undefined` without throwing; maps successful GET to `currentCredentialId` |
| Unit — `useSetSystemAgentPreference.test.ts` | `shared/` | Success calls `onSuccess` + success snackbar; API error surfaces `getRequestErrorMessage` text; `savingCredentialId` tracks the in-flight row only (busy-state isolation, same assertion style as `testingCredentialId`) |
| Unit — `SystemAgentPreferenceBadge.test.tsx` | `shared/` | Renders badge only when id matches; renders nothing otherwise (black-box render assertions per `code-rules-general.mdc`) |
| Unit — `SystemAgentPreferenceAction.test.tsx` | `shared/` | Disabled when inactive/disconnected; hidden when already current; fires `onClick` with credential id otherwise |
| Unit — `useAiIntegrationList.test.ts` (extend existing) | `AiIntegrationsList/` | New: `handleSetSystemAgentPreference` invokes facade + triggers `refreshList`-equivalent refetch; delete error now surfaces backend `ConflictError` message instead of generic text |
| Unit — `useAiIntegrationEditPage.test.ts` (extend existing, if present, else colocate `.test.tsx`) | edit page | Badge/action state reflects `currentCredentialId` vs `credentialId` from route params |
| E2E (optional, only if user explicitly wants Gherkin coverage) | `apps/web/e2e/features/ai-integrations/` | "User sets system agent connection from list", "User sets system agent connection from edit page", "Disconnected credential cannot be set as preference", "Deleting the current preference credential shows a blocking error" — reuse existing `apps/web/e2e/steps/utils/seedMultiSpecTask.ts`-style seeding conventions from `multi-specialization-tasks` steps if a credential-seeding helper doesn't already exist under `e2e/steps/utils/` |

No new backend integration tests needed — `setConnectionPreference`/`deleteCredential` handler tests already cover the validation/guard logic being surfaced (see `services/agent/src/handlers/setConnectionPreference/index.test.ts`, `deleteCredential` tests).

### Edge Cases

| # | Scenario | Handling |
|---|----------|----------|
| 1 | Credential is `connectionStatus: 'untested'` or `'failed'` | Action button disabled with helper text; user must "Test" first (existing Test action in the same row) |
| 2 | Credential `status: 'archived'` or `'disabled'` | Action hidden entirely (archived rows already only show Restore, not Delete/Test — preference action follows the same visibility rule) |
| 3 | No preference set yet (`getConnectionPreference` 404) | Treated as "unset" — no row shows "Current"; all eligible rows show the action; first successful click establishes it |
| 4 | Preference points to a credential that was later deleted/archived | `currentCredentialId` from GET may reference a row not present in the current filtered/paginated list view — badge simply won't render on this page; not a bug, matches list pagination/filtering semantics already accepted elsewhere in this doc |
| 5 | User attempts to delete the current-preference credential | Backend `ConflictError` ("Cannot delete this credential because it powers system agents…") now surfaces verbatim in the snackbar (bundled fix in step 3) instead of masking it |
| 6 | Loading states | Preference GET runs in parallel with the list/detail fetch; while `isLoading`, render no badge/no action (avoid flashing incorrect "Set as system connection" before we know the true current id) — same “skip render until data resolved” approach as `AiIntegrationEditPage`'s `view.phase === 'loading'` guard |
| 7 | Rapid double-click / concurrent set requests | `savingCredentialId` busy-state disables the clicked action and (optionally) all other rows' actions while a PUT is in-flight — same single-flight pattern as `testingCredentialId` |
| 8 | User sets preference to the same credential that's already current | Not reachable via UI (action hidden for the current row per edge case handling), so no redundant PUT is possible |

### Todo Plan

1. **`apps/web`** — [Type: extend existing app — UI-only feature]
   - Changes needed: Add shared facade hooks + presentational badge/action components under `agents/_components/ai-integrations/_components/shared/`; wire into `AiIntegrationsList` (`useAiIntegrationList.ts`, `tableColumns.tsx`, `AiIntegrationsList.tsx`) and the edit page (`useAiIntegrationEditPage.tsx`, `AiIntegrationEditPage.tsx`); fix `handleDelete` error surfacing for the preference-conflict guard
   - Files: see File-Level Implementation Steps §1–4 above
   - Suggested subagent workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (loop: max 2 iterations) → `documentation-writer`
   - Dependencies: None — all backend/API/hooks already shipped

That is the only todo item; no other package requires changes.
