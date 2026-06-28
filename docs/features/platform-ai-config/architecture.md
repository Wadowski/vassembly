# Architecture: Platform vs User AI Credential Routing

**Status:** Ready for implementation
**Feature slug:** `platform-ai-config`
**PRD:** [`prd.md`](./prd.md)
**Last updated:** 2026-06-27

---

## 1. Analysis — Reuse vs New

### 1.1 What already exists (reuse)

| Concern | Existing asset | Decision |
|---|---|---|
| Model client construction | `domains/ai-integration/src/clients/langchain.ts` → `getModeledProviderClient({ provider, apiKey, baseUrl, organizationId, model })` | **Reuse as-is.** Already provider-agnostic, already supports `lm_studio` without API key (the underlying `createProviderClient` only requires `apiKey` for non-`lm_studio`). |
| Provider client factory | `packages/client-langchain/src/createProviderClient.ts` (Strategy map `PROVIDER_CLIENT_CREATORS`) | **Reuse, no change.** Already keyed by `gemini`/`deep_seek`/`lm_studio`/… and handles the E2E stub via `E2E_STUB_API_KEY`. |
| User credential resolution | `domains/ai-integration/src/commands/resolveAndBuildClient` | **Reuse, unchanged.** Continues to serve all User-AI call sites. |
| Single invoke choke point | `services/agent/src/internalTools/runAgentInvokeWithTools.ts` → `resolveCredentialAndClient` | **Extend.** Every platform and user agent invocation already funnels through here. This is where routing is selected. |
| Result/snapshot shape | `ResolveAndBuildClientResult` (`{ client, integrationSnapshot }`) | **Reuse the type** for the new platform resolver so `recordProgress`/logging stays identical. |
| Domain-reads-config precedent | `domains/user`, `domains/skill`, `domains/system-agent` all import `@vassembly/config` | **Reuse the convention.** The new platform resolver command may read `config.platformAi` directly inside the `ai-integration` domain. |
| Config env wiring pattern | `packages/config/src/{development,production,e2e}.ts` | **Extend** with a `platformAi` block, same `process.env.X || ''` pattern. |
| E2E stub routing | `createProviderClient` returns the stub when `apiKey === 'e2e-web-test-api-key'` | **Reuse.** `e2e.ts` seeds `platformAi.apiKey` with the stub key so platform-routed calls hit the stub. |

### 1.2 What is genuinely new (minimal)

1. **`PlatformAiConfig`** block on `Config` + env wiring (`packages/config`).
2. **`validatePlatformAiConfig`** fail-fast bootstrap validator (`packages/config`), invoked from `apps/api` `startApp()`.
3. **`resolvePlatformClient`** domain command (`domains/ai-integration`) — builds a modeled client from `config.platformAi`, no DB lookup, no ownership check.
4. **`credentialScope: 'platform' | 'user'`** routing param on `runAgentInvokeWithTools` + a Strategy map in `resolveCredentialAndClient`.
5. **Per-call-site edits** at P-1…P-4 to pass `credentialScope: 'platform'` and drop the user `missing_credential` guard.

No new packages, no new domain, no new service. The legacy `config.deepSeekAi` / `DEEP_SEEK_AI_*` block is **deprecated in place** (kept until a separate removal ticket per PRD Q-4) and gains **no new readers**.

### 1.3 Design patterns applied

| Pattern | Where | Why |
|---|---|---|
| **Strategy** | `resolveCredentialAndClient` selects `{ platform, user }` resolver by `credentialScope`; `validatePlatformAiConfig` selects required-field rules by provider via a map | Repo rule "map object instead of switch"; mirrors existing `PROVIDER_CLIENT_CREATORS` strategy map. |
| **Command** | New `resolvePlatformClient` lives in `domains/ai-integration/src/commands/` alongside `resolveAndBuildClient` | Matches domain "one folder per write/operation" convention. |
| **Facade** | `runAgentInvokeWithTools` remains the single entry point hiding credential-source selection from call sites | Call sites only declare *intent* (`platform`/`user`), not *how* the client is built. |
| **Adapter** | Existing `getModeledProviderClient` wraps `client-langchain` | Reused, not re-created — the domain stays the only importer of `@vassembly/client-langchain`. |
| **Guard / Fail-fast** | `validatePlatformAiConfig` at bootstrap | Stops the app before serving requests on invalid config. |

### 1.4 Nested-flow decision (PRD §4.4 / Q-1) — confirmed

**Route by operation at the actual LLM call site, not by the triggering flow.** `runTaskSpecializationClassification` (U-2) issues **no** direct LLM call — it is a pass-through orchestrator. Its delegated operations `classifySpecialization` (P-2), `mapMcpsToSpecialization` (P-3), and `generateSpecializationAgentDescriptions` (P-4) each invoke the LLM and therefore use the **platform** credential. No code change is needed in `runTaskSpecializationClassification.ts` itself — it neither resolves nor passes a credential.

### 1.5 P-5 (platform agent catalog create/edit) — scope clarification (PRD Q-2)

System-agent create/update (`domains/system-agent`, `apps/api/src/routes/system-agents/{create,update}.ts`) is **pure CRUD today — there is no LLM-assisted create/edit call**. Therefore **P-5 is a no-op for v1**: there is no call site to re-route. If an LLM-assist is added later, it must call `runAgentInvokeWithTools({ credentialScope: 'platform' })`. Documented and out of implementation scope.

### 1.6 Test strategy summary

- **Unit (`tdd-unit-test-writer`)** for: config validator (`packages/config`), `resolvePlatformClient` (`domains/ai-integration`), `resolveCredentialAndClient` routing (`services/agent`), and each re-routed handler (`services/task`, `services/agent`).
- **No E2E todo** beyond existing coverage: the PRD's Gherkin is bootstrap/credential-source oriented and the `e2e.ts` stub already exercises platform-routed calls through the existing task-creation E2E flows. Backend unit tests own the routing correctness. (E2E can be added later if QA wants explicit `credentialSource` assertions.)

---

## 2. Config Package Changes (`packages/config`)

### 2.1 `PlatformAiConfig` type (`src/types.ts`)

```typescript
export interface PlatformAiConfig {
  provider: string;        // AiIntegrationProvider value: 'gemini' | 'deep_seek' | 'lm_studio'
  apiKey: string;          // empty allowed only when provider === 'lm_studio'
  baseUrl: string;         // required for 'lm_studio' and 'deep_seek'
  defaultModel: string;
  organizationId?: string;
}

export interface Config {
  // ...existing fields
  deepSeekAi: DeepSeekAiConfig; // @deprecated superseded by platformAi; no new readers (PRD Q-4)
  platformAi: PlatformAiConfig;
}
```

Mark `DeepSeekAiConfig` with a `@deprecated` JSDoc note (do not remove).

### 2.2 Env wiring (each of `development.ts`, `production.ts`, `e2e.ts`)

```typescript
platformAi: {
  provider: process.env.PLATFORM_AI_PROVIDER || '',
  apiKey: process.env.PLATFORM_AI_API_KEY || '',
  baseUrl: process.env.PLATFORM_AI_BASE_URL || '',
  defaultModel: process.env.PLATFORM_AI_DEFAULT_MODEL || '',
  organizationId: process.env.PLATFORM_AI_ORGANIZATION_ID,
},
```

**E2E defaults** (`e2e.ts`) — wire so platform-routed calls hit the existing stub provider:

```typescript
platformAi: {
  provider: process.env.PLATFORM_AI_PROVIDER || 'gemini',
  apiKey: process.env.PLATFORM_AI_API_KEY || 'e2e-web-test-api-key', // E2E_STUB_API_KEY
  baseUrl: process.env.PLATFORM_AI_BASE_URL || '',
  defaultModel: process.env.PLATFORM_AI_DEFAULT_MODEL || 'gemini-2.0-flash',
  organizationId: process.env.PLATFORM_AI_ORGANIZATION_ID,
},
```

> Keep the stub key/model as literals in `e2e.ts` (config must not import `@vassembly/client-langchain`). Add a code comment pointing to `E2E_STUB_API_KEY` / `E2E_STUB_MODEL` in `packages/client-langchain/src/providers/createE2eStubProvider.ts` so they stay in sync.

### 2.3 Bootstrap validator (`src/validatePlatformAiConfig/`)

New module `packages/config/src/validatePlatformAiConfig/index.ts` exporting `validatePlatformAiConfig(input: PlatformAiConfig): void`.

- Allowed providers: `['gemini', 'deep_seek', 'lm_studio']` (subset of `AiIntegrationProvider`; do **not** add a new enum — keep these as a local `const` array of the same string values to avoid a domain→config dependency).
- **Strategy map** of per-provider required fields:

```typescript
const PROVIDER_REQUIRED_FIELDS: Record<string, Array<'apiKey' | 'baseUrl'>> = {
  gemini:    ['apiKey'],            // baseUrl optional (provider default)
  deep_seek: ['apiKey', 'baseUrl'],
  lm_studio: ['baseUrl'],           // no apiKey required
};
```

- Rules (enforce the PRD §6.4 Validity Matrix):
  - `defaultModel` non-empty (always).
  - `provider` must be in the allowed set, else error "PLATFORM_AI_PROVIDER is not allowed for platform AI…".
  - For each field in `PROVIDER_REQUIRED_FIELDS[provider]`, value must be non-empty.
- On failure: `throw new Error('<FIELD> is required ...')` with the offending field name(s). **Never** include the API key value in the message. Collect all errors and throw once with a joined, readable message.
- Schema-only — **no** network/provider ping (BV-5).
- Recommend implementing with **zod** `superRefine` (add `zod` to `packages/config` deps, already used repo-wide) for consistency; a hand-rolled validator using the map above is acceptable and avoids the new dependency. Either is fine — coder's choice, keep it dependency-light.

Export from `src/index.ts`:

```typescript
export { validatePlatformAiConfig } from './validatePlatformAiConfig';
export type { Config, PlatformAiConfig, /* ...existing */ } from './types';
```

### 2.4 `turbo.json` `globalEnv`

Add the new vars so Turbo cache keys account for them:

```
"PLATFORM_AI_PROVIDER",
"PLATFORM_AI_API_KEY",
"PLATFORM_AI_BASE_URL",
"PLATFORM_AI_DEFAULT_MODEL",
"PLATFORM_AI_ORGANIZATION_ID"
```

(Leave the legacy `DEEP_SEEK_AI_*` entries until the removal ticket.)

---

## 3. Platform Client Resolver Design (`domains/ai-integration`)

New command folder `domains/ai-integration/src/commands/resolvePlatformClient/` (Command pattern, sibling of `resolveAndBuildClient`).

**`index.ts`**

```typescript
import { config } from '@vassembly/config';
import { ValidationError } from '@vassembly/errors';

import { getModeledProviderClient } from '../../clients';
import { AiIntegrationProvider } from '../../constants';

import type { ResolvePlatformClientResult } from './types';

const PLATFORM_INTEGRATION_NAME = 'Platform AI';

export const resolvePlatformClient = async (): Promise<ResolvePlatformClientResult> => {
  const { provider, apiKey, baseUrl, defaultModel, organizationId } = config.platformAi;

  // Defensive: bootstrap validation should already guarantee this.
  if (!defaultModel) {
    throw new ValidationError('Platform AI default model is not configured');
  }

  const resolvedApiKey =
    provider === AiIntegrationProvider.LmStudio ? (apiKey || undefined) : apiKey;

  const client = getModeledProviderClient({
    provider,
    apiKey: resolvedApiKey,
    baseUrl: baseUrl || undefined,
    organizationId: organizationId || undefined,
    model: defaultModel,
  });

  return {
    client,
    integrationSnapshot: {
      integrationName: PLATFORM_INTEGRATION_NAME,
      provider,
      model: defaultModel,
    },
  };
};
```

**`types.ts`** — reuse the existing snapshot/result shape so the choke point stays uniform:

```typescript
import type { ResolveAndBuildClientResult } from '../resolveAndBuildClient/types';

export type ResolvePlatformClientResult = ResolveAndBuildClientResult;
```

**Exports** — `domains/ai-integration/src/commands/index.ts` and `src/index.ts`:

```typescript
export { resolvePlatformClient } from './resolvePlatformClient';
export type { ResolvePlatformClientResult } from './resolvePlatformClient/types';
```

Notes:
- **No user lookup, no ownership/connection-status validation** (FR-1).
- `apiKey` from env is **plaintext** — do **not** call `decode()` (unlike the user path which decodes an encrypted DB value).
- `lm_studio` builds without a key (FR-4) — the underlying factory already enforces base URL.
- Domain remains the only importer of `@vassembly/client-langchain` (via `clients/langchain.ts`). Reading `config` follows the established `domains/user|skill|system-agent` precedent.

---

## 4. Routing at `runAgentInvokeWithTools` (`services/agent`)

### 4.1 Add `credentialScope` to params (`internalTools/types.ts`)

```typescript
export type CredentialScope = 'platform' | 'user';

export interface RunAgentInvokeWithToolsParams {
  userId: string;
  agentType: 'personal' | 'system';
  agentId: string;
  message: string;
  credentialScope?: CredentialScope; // default 'user'
  connectionOverride?: { integrationCredentialId: string };
  toolContext: InternalToolContext;
}
```

### 4.2 `resolveCredentialAndClient` — Strategy by scope (`runAgentInvokeWithTools.ts`)

- Add `credentialScope` to `ResolveCredentialAndClientParams`.
- Platform scope is only valid with `agentType: 'system'` (all P-* sites use system agents). Keep the existing active-agent existence check, then resolve from config:

```typescript
const resolveCredentialAndClient = async ({
  userId,
  agentType,
  agentId,
  connectionOverride,
  credentialScope = 'user',
}: ResolveCredentialAndClientParams): Promise<ResolveCredentialAndClientResult> => {
  if (credentialScope === 'platform') {
    const { data: agent } = await systemAgentDomain.queries.getActiveById({ id: agentId });
    if (agent === null) {
      throw new NotFoundError('This platform agent is no longer available.', {
        code: SYSTEM_AGENT_ERROR_CODES.NOT_FOUND,
      });
    }
    return aiIntegrationDomain.commands.resolvePlatformClient();
  }

  // ...existing personal/system user-credential logic unchanged...
};
```

- Thread `credentialScope: params.credentialScope` into the `resolveCredentialAndClient` call inside `runAgentInvokeWithTools`.
- `integrationSnapshot` returned by `resolvePlatformClient` (`integrationName: 'Platform AI'`) flows into `recordProgress`, giving observability of the platform path (satisfies §9.3 logging intent). Optionally also pass an explicit `credentialSource` field — see §8.

### 4.3 Behavior guarantees

- User path (`credentialScope` omitted/`'user'`) is **byte-for-byte unchanged** (FR-6).
- `userId` still passed through for logging/ownership/tool context even on the platform path (FR-9).
- Platform path no longer depends on `connectionOverride` (FR-7).

---

## 5. Per-Call-Site Changes

### 5.1 P-1 Task title — `services/task/src/handlers/generateTaskTitle/index.ts`

- **Remove** the `getPreferenceByUserId` lookup, the `integrationCredentialId` variable, and the `missing_credential` skip block (lines ~33–39).
- **Remove** `connectionOverride` from the `runAgentInvokeWithTools` call; **add** `credentialScope: 'platform'`.
- Keep the existing try/catch silent-failure contract (E-5). Title stays `null` on platform failure.

```typescript
const invokeResult = await runAgentInvokeWithTools({
  userId,
  agentType: 'system',
  agentId: agentResult.data.id!,
  message: task.description,
  credentialScope: 'platform',
  toolContext: {} as Parameters<typeof runAgentInvokeWithTools>[0]['toolContext'],
});
```

### 5.2 P-2 Specialization classify — `services/agent/src/internalTools/classifySpecialization/index.ts`

- **Remove** the `getPreferenceByUserId` lookup + `missing_credential` skip (lines ~78–93).
- **Remove** `connectionOverride`; **add** `credentialScope: 'platform'` to the invoke call.
- Keep all other skip reasons (`short_description`, normalize failures).

### 5.3 P-3 MCP mapping — `services/agent/src/internalTools/createSpecialization/mapMcpsToSpecialization.ts`

- **Drop** `connectionOverride` from `MapMcpsToSpecializationParams`.
- Invoke with `credentialScope: 'platform'` (remove `connectionOverride`).

### 5.4 P-4 Agent descriptions — `services/agent/src/internalTools/createSpecialization/generateSpecializationAgentDescriptions.ts`

- **Drop** `connectionOverride` from `GenerateSpecializationAgentDescriptionsParams`.
- Invoke with `credentialScope: 'platform'`. Remains fire-and-forget (E-10).

### 5.5 Orchestrator — `services/agent/src/internalTools/createSpecialization/index.ts`

- **Remove** the `getPreferenceByUserId` lookup + `integrationCredentialId` gating (lines ~49–95). Catalog enrichment must run regardless of the user's credential (PRD §11.2: gate on platform availability, not user credential).
- Always fire `mapMcpsToSpecialization` and (when `createdAgentIds.length > 0`) `generateSpecializationAgentDescriptions`, **without** `connectionOverride`:

```typescript
if (isNew) {
  const { createdAgentIds } = await provisionSpecializationAgents({ specializationId, specializationName: name });

  void mapMcpsToSpecialization({
    specializationId,
    specializationName: name,
    specializationDescription: description,
    userId: context.userId,
    toolContext: context,
  }).catch((error) => logSpecializationEvent({ /* mcp_mapping.failed */ }));

  if (createdAgentIds.length > 0) {
    void generateSpecializationAgentDescriptions({
      agentIds: createdAgentIds,
      specializationName: name,
      specializationId,
      userId: context.userId,
      toolContext: context,
    }).catch((error) => logSpecializationEvent({ /* agent.description.failed */ }));
  }
}
```

- Remove the now-dead `missing_credential` skip log branch.

### 5.6 U-2 orchestrator — `services/task/src/handlers/executeTask/runTaskSpecializationClassification.ts`

- **No change.** Pass-through; resolves no credential (confirmed §1.4).

### 5.7 User-AI sites — no change (regression-guard)

| Site | File | Note |
|---|---|---|
| U-1 Task execution | `services/task/src/handlers/executeTask/index.ts` | unchanged; still `MISSING_CREDENTIAL` when user has none |
| U-3 Task category | `services/task/src/handlers/generateTaskCategory/index.ts` | unchanged |
| U-4 `useAgent` | `services/agent/src/internalTools/useAgent/index.ts` | unchanged |
| U-5 Personal invoke | `services/agent/src/handlers/invokePersonalAgent/index.ts` | unchanged |
| U-6 System invoke (UI) | `services/agent/src/handlers/invokeSystemAgent/index.ts` | unchanged — see §6 |

---

## 6. `invokeSystemAgent` — User Credential for Direct UI Invoke (U-6)

`services/agent/src/handlers/invokeSystemAgent/index.ts` is the explicit UI-driven invoke (route `apps/api/src/routes/system-agents/invoke.ts`). It already:
- resolves the user's system-call credential via `resolveSystemCallCredentialId({ userId })`, and
- allows an admin `connectionOverride` after an admin-role assertion.

**Decision: leave unchanged.** It calls `runAgentInvokeWithTools` **without** `credentialScope`, so it defaults to `'user'`. This satisfies the PRD scenario "Explicit UI invoke of a system agent uses the user's credential" and "admin may override". Do **not** pass `credentialScope: 'platform'` here.

> Contrast: P-1…P-4 invoke the **same** system agents but originate from platform background work, so they pass `credentialScope: 'platform'`. The routing key is the *caller intent*, expressed at each call site — exactly what the `credentialScope` Facade param encodes.

---

## 7. Testing Strategy (Unit)

| Package | Test file(s) | Cases |
|---|---|---|
| `packages/config` | `src/validatePlatformAiConfig/index.test.ts` | valid `gemini` (key, no baseUrl) ✅; missing `defaultModel` ❌ names field; unsupported provider ❌; `lm_studio` no key ✅; `lm_studio` no baseUrl ❌ names field; `deep_seek` no baseUrl ❌; error message **never** contains the API key value. |
| `domains/ai-integration` | `src/commands/resolvePlatformClient/index.test.ts` | builds client from a stubbed `config.platformAi` for each provider; `lm_studio` builds without key; returns snapshot `{ integrationName: 'Platform AI', provider, model }`; uses `defaultModel`; does **not** query Mongo / does **not** call `decode`. Mock `@vassembly/config` and `../../clients`. |
| `services/agent` | `internalTools/runAgentInvokeWithTools.test.ts` (extend) | `credentialScope: 'platform'` → calls `resolvePlatformClient`, not `resolveAndBuildClient`; default/`'user'` → user path unchanged; platform path still checks active system agent and throws `NotFound` when missing. |
| `services/agent` | `classifySpecialization/index.test.ts`, `createSpecialization/index.test.ts` (extend) | no `getPreferenceByUserId` call; classify runs without user credential; orchestrator fires MCP mapping + descriptions regardless of user credential; no `missing_credential` skip. |
| `services/task` | `generateTaskTitle/index.test.ts` (extend) | title generated for a user with **no** AI integration; invoke called with `credentialScope: 'platform'` and **no** `connectionOverride`; platform failure → title stays unset, no throw. |

Black-box style per `unit-test-standards.mdc`: stub domain/config dependencies, assert observable output (skip reasons, invoke arguments via mocks limited to routing branch selection). Bootstrap fail-fast itself (`process.exit`) is verified via the validator unit tests (throw assertions), not by booting the server.

---

## 8. Observability (§9.3) — light touch

- The platform `integrationSnapshot` (`integrationName: 'Platform AI'`) already differentiates platform vs user invocations in `recordAgentInvokeProgress` events.
- Add `credentialSource` (`'platform' | 'user'`) to the invocation log at the `runAgentInvokeWithTools` choke point so log audits (§14 metric "Correct routing") are trivial. This is a single structured-log addition derived from `credentialScope`; **do not** log the API key (§9.2).
- Bootstrap validator throws with the offending field name only (no secret) → `apps/api` `startApp()` catch logs `platform_ai.config.invalid` and exits non-zero.

---

## 9. Bootstrap Wiring (`apps/api`)

`apps/api/src/routes/index.ts` `startApp()` — validate **before** any init/listen (BV-1):

```typescript
import { config, validatePlatformAiConfig } from '@vassembly/config';

const startApp = async () => {
  try {
    validatePlatformAiConfig(config.platformAi); // fail-fast, schema-only
  } catch (error) {
    console.error('platform_ai.config.invalid', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  // ...existing cache/redis/mongo/seed/listen...
};
```

Place validation as the **first** statement so an invalid config never reaches DB seeding or `listen`.

---

## 10. Env Example / `.env` Updates

There is **no** `.env.example` in the repo. Update the actual env files and Turbo config:

| File | Change |
|---|---|
| `.env` (root, dev) | Add `PLATFORM_AI_PROVIDER`, `PLATFORM_AI_API_KEY`, `PLATFORM_AI_BASE_URL`, `PLATFORM_AI_DEFAULT_MODEL`, optional `PLATFORM_AI_ORGANIZATION_ID`. Example for local dev (e.g. `lm_studio` + base URL, or `gemini` + key + model). Keep legacy `DEEP_SEEK_AI_*` until removal ticket. |
| `.env.e2e` | Optional — defaults in `e2e.ts` already route to the stub; add explicit `PLATFORM_AI_*` only if overriding. |
| `turbo.json` `globalEnv` | Add the five `PLATFORM_AI_*` vars (see §2.4). |
| CD pipeline (ops) | Provision all required `PLATFORM_AI_*` in **every** environment **before** deploy (BV-7 / §15.2). Out of code scope — flag to DevOps. |

Example `.env` addition (dev, lm_studio — no key needed):

```bash
# Platform AI (background/platform-owned LLM work)
PLATFORM_AI_PROVIDER=lm_studio
PLATFORM_AI_API_KEY=
PLATFORM_AI_BASE_URL=http://localhost:1234/v1
PLATFORM_AI_DEFAULT_MODEL=local-model
# PLATFORM_AI_ORGANIZATION_ID=
```

---

## 11. Architecture & Package Placement

```
Bootstrap:  apps/api startApp() ──> validatePlatformAiConfig(config.platformAi)  [fail-fast]

Platform call site (P-1..P-4)
  services/task | services/agent
    └─ runAgentInvokeWithTools({ credentialScope: 'platform' })     [Facade, services/agent]
         └─ resolveCredentialAndClient (Strategy by scope)
              └─ aiIntegrationDomain.commands.resolvePlatformClient()  [Command, domains/ai-integration]
                   └─ getModeledProviderClient(config.platformAi)       [clients/langchain.ts]
                        └─ createProviderClient (Strategy map)          [packages/client-langchain]

User call site (U-1..U-6)
    └─ runAgentInvokeWithTools({ /* credentialScope:'user' default */, connectionOverride })
         └─ resolveCredentialAndClient
              └─ aiIntegrationDomain.commands.resolveAndBuildClient()   [unchanged]
```

- **Config**: env + validation only (no provider logic).
- **Domain (`ai-integration`)**: sole owner of client construction (both user & platform); only importer of `@vassembly/client-langchain`.
- **Service (`agent`)**: routing decision (Facade + Strategy); never imports a client package.
- **Apps (`api`)**: bootstrap validation entry point.
- Conventions respected: data **reads** (preferences/agents) stay GraphQL/domain queries; this feature introduces **no** new HTTP/GraphQL surface (no REST/GraphQL change — purely internal credential routing). Named exports, object args, `types.ts` per folder, ≤100-line files.

---

## 12. Implementation Plan / Todos (for coder)

> Suggested workflow legend: `tdd-unit-test-writer → coder ↔ code-reviewer (max 2) → documentation-writer`.

### Todo 1 — `@vassembly/config` (extend package)
- **Type:** extend utility package
- **Changes:** Add `PlatformAiConfig` + `platformAi` to `Config`; deprecate `DeepSeekAiConfig` (JSDoc only); wire `platformAi` in `development.ts`, `production.ts`, `e2e.ts` (e2e uses stub key/model literals); add `validatePlatformAiConfig` (provider→required-fields Strategy map, fail-fast, no secret in errors); export validator + `PlatformAiConfig` type; add `PLATFORM_AI_*` to `turbo.json` `globalEnv`.
- **Files:** `packages/config/src/types.ts`, `development.ts`, `production.ts`, `e2e.ts`, `index.ts`, `validatePlatformAiConfig/index.ts`, `validatePlatformAiConfig/index.test.ts`; `turbo.json`.
- **Workflow:** `tdd-unit-test-writer → coder ↔ code-reviewer → documentation-writer`
- **Dependencies:** none (do first).

### Todo 2 — `domains/ai-integration` (new command)
- **Type:** extend domain
- **Changes:** Add `resolvePlatformClient` command reading `config.platformAi`, building via existing `getModeledProviderClient` (no DB lookup, no ownership check, no `decode`, `lm_studio` without key); reuse `ResolveAndBuildClientResult` shape; export from `commands/index.ts` and `src/index.ts`.
- **Files:** `domains/ai-integration/src/commands/resolvePlatformClient/{index.ts,types.ts,index.test.ts}`, `commands/index.ts`, `src/index.ts`.
- **Workflow:** `tdd-unit-test-writer → coder ↔ code-reviewer → documentation-writer`
- **Dependencies:** Todo 1 (needs `config.platformAi` type).

### Todo 3 — `services/agent` (routing + re-routed call sites)
- **Type:** extend service
- **Changes:**
  - Add `credentialScope` to `RunAgentInvokeWithToolsParams` (`internalTools/types.ts`); add `CredentialScope` type.
  - `resolveCredentialAndClient`: Strategy by scope → platform branch calls `resolvePlatformClient` (system agent only) after active-agent check; thread `credentialScope` from `runAgentInvokeWithTools`; add `credentialSource` to invocation log.
  - P-2: `classifySpecialization/index.ts` — drop preference lookup + `missing_credential` skip, pass `credentialScope: 'platform'`.
  - P-3: `mapMcpsToSpecialization.ts` — drop `connectionOverride` param, pass `credentialScope: 'platform'`.
  - P-4: `generateSpecializationAgentDescriptions.ts` — drop `connectionOverride` param, pass `credentialScope: 'platform'`.
  - Orchestrator `createSpecialization/index.ts` — remove user-credential gating; always run mapping + descriptions.
- **Files:** `services/agent/src/internalTools/types.ts`, `runAgentInvokeWithTools.ts`, `classifySpecialization/index.ts`, `createSpecialization/index.ts`, `createSpecialization/mapMcpsToSpecialization.ts`, `createSpecialization/generateSpecializationAgentDescriptions.ts` + extend the relevant `.test.ts` files.
- **Workflow:** `tdd-unit-test-writer → coder ↔ code-reviewer → documentation-writer`
- **Dependencies:** Todo 2.

### Todo 4 — `services/task` (P-1 re-route)
- **Type:** extend service
- **Changes:** `generateTaskTitle/index.ts` — drop preference lookup + `missing_credential` skip; pass `credentialScope: 'platform'`, no `connectionOverride`; keep silent-failure contract. Confirm `executeTask`, `generateTaskCategory`, `runTaskSpecializationClassification` **unchanged**.
- **Files:** `services/task/src/handlers/generateTaskTitle/index.ts` + extend `index.test.ts`.
- **Workflow:** `tdd-unit-test-writer → coder ↔ code-reviewer → documentation-writer`
- **Dependencies:** Todo 3 (`credentialScope` param must exist).

### Todo 5 — `apps/api` (bootstrap validation)
- **Type:** extend app
- **Changes:** Call `validatePlatformAiConfig(config.platformAi)` as the first action in `startApp()`; on throw → log `platform_ai.config.invalid` (no secret) and `process.exit(1)`.
- **Files:** `apps/api/src/routes/index.ts`.
- **Workflow:** `coder ↔ code-reviewer` (trivial; validator unit tests in Todo 1 cover logic).
- **Dependencies:** Todo 1.

### Todo 6 — Env & PRD amendments (docs)
- **Type:** docs/config
- **Changes:** Add `PLATFORM_AI_*` to `.env` (and optionally `.env.e2e`); amend `docs/features/task-title-generator/prd.md` (AC-3, FR-B4, E-3) and `docs/features/specialization/prd.md` (Phase 1.1 delta) per PRD §11; flag CD provisioning to DevOps (BV-7).
- **Files:** `.env`, `docs/features/task-title-generator/prd.md`, `docs/features/specialization/prd.md`.
- **Workflow:** `documentation-writer → Done`
- **Dependencies:** none (can run in parallel).

**Parallelism:** Todo 1 first. Then Todo 2 and Todo 6 in parallel. Then Todo 3, then Todo 4. Todo 5 after Todo 1. Todo 5 may land alongside Todo 3/4.
