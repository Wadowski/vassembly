# Product Requirements Document: Platform vs User AI Credential Routing

**Document status:** Draft for engineering, design, and QA handoff
**Last updated:** 2026-06-27
**Feature slug:** `platform-ai-config`
**Related docs:** [Async LLM Task Execution](../async-llm-task-execution/prd.md) · [Task Title Generator](../task-title-generator/prd.md) · [Specialization](../specialization/prd.md) · [System Agents](../system-agent/prd.md) · [AI Integrations](../ai-integrations/prd.md)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Scope](#3-scope)
4. [Routing Principle & Call-Site Table](#4-routing-principle--call-site-table)
5. [Functional Requirements](#5-functional-requirements)
6. [Config & Environment Contract](#6-config--environment-contract)
7. [Bootstrap Validation Requirements](#7-bootstrap-validation-requirements)
8. [Edge Cases & Error Handling](#8-edge-cases--error-handling)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Gherkin Acceptance Scenarios](#10-gherkin-acceptance-scenarios)
11. [PRD Amendment Notes](#11-prd-amendment-notes)
12. [Open Questions & Decisions](#12-open-questions--decisions)
13. [Acceptance Criteria (QA Checklist)](#13-acceptance-criteria-qa-checklist)
14. [Success Metrics](#14-success-metrics)
15. [Dependencies](#15-dependencies)

---

## 1. Overview

### 1.1 Feature Summary

Vassembly invokes the LLM from many call sites. Today **every** invocation resolves the model client from the **user's** AI integration credential (`userSystemAgentPreferences.integrationCredentialId`), regardless of whether the work benefits the user or the platform. This feature introduces **two distinct credential sources** and routes each LLM call site to the correct one:

| Source | Backed by | Billed to | Used for |
|--------|-----------|-----------|----------|
| **Platform AI** | `@vassembly/config` `PLATFORM_AI_*` env vars | Platform operator | Work that benefits the **platform**, not a specific user |
| **User AI** | User's stored AI integration credential (`integrationCredentialId`) | The user | Work that produces the **user's** result or runs the **user's** agents |

The result: platform-owned background work (task titles, specialization catalog building, platform agent description generation) no longer requires — or bills against — a user's personal AI credential, while all task execution and user-initiated agent work continues to use the user's own credential.

### 1.2 Problem Statement

| Problem | Impact |
|---------|--------|
| New users without a configured AI integration get **no task titles** and **no specialization classification** | Core "scannable list" and catalog-enrichment value is gated behind user setup |
| Platform-benefiting LLM work (shared specialization catalog, platform agent descriptions, MCP mapping) is **billed to whichever user triggered it** | Users incorrectly pay for platform infrastructure work |
| There is **no platform-level AI credential** | The platform cannot perform any LLM work autonomously |
| Config is **DeepSeek-specific** (`DEEP_SEEK_AI_*`, `config.deepSeekAi`) | Not provider-agnostic; cannot represent the chosen platform provider/model cleanly |

### 1.3 Solution

1. Add a provider-agnostic **platform AI config** block (`config.platformAi`) sourced from new `PLATFORM_AI_*` env vars.
2. Validate platform AI config with a schema at **application bootstrap**; **fail fast** on invalid config.
3. Add a way to build a model client from the **platform** config (no stored credential, no per-user ownership check).
4. Route each LLM call site to **platform AI** or **user AI** per the authoritative [Call-Site Table](#4-routing-principle--call-site-table).

---

## 2. Goals & Non-Goals

### 2.1 Goals

| Goal | Description |
|------|-------------|
| **Correct cost attribution** | Platform-benefiting LLM work uses platform credentials; user-benefiting work uses user credentials |
| **Decouple platform work from user setup** | Task titles and catalog building succeed even when the user has no AI integration |
| **Provider-agnostic platform config** | Support Gemini, DeepSeek, and lm_studio (aligned with `AiIntegrationProvider`) via a single config block and default model |
| **Fail-fast configuration** | Invalid platform AI config stops the app at startup, not at first LLM call |
| **Single source of routing truth** | Every LLM call site has a documented, deterministic credential source |

### 2.2 Non-Goals

| Non-Goal | Rationale |
|----------|-----------|
| UI for managing platform AI config | Config is env-driven only in v1 |
| Billing, quotas, or usage metering for platform AI | Out of scope; operator absorbs cost |
| Skill LLM routing | Skill execution LLM is not yet implemented; route when built |
| Live provider connectivity ping at startup | v1 validates **schema only**, not provider reachability |
| Per-environment provider restrictions | `lm_studio` is allowed in **all** environments per product decision |
| Multiple platform credentials / platform credential rotation UI | Single default model + single credential set in v1 |
| Changing user AI credential resolution (`userSystemAgentPreferences`) | User path is unchanged except where a call site is re-routed to platform |

---

## 3. Scope

### 3.1 In-Scope

| Area | Deliverable |
|------|-------------|
| **Config package** | New `PlatformAiConfig` block on `Config`; `PLATFORM_AI_*` env wiring in `development.ts`, `production.ts`, `e2e.ts` |
| **Bootstrap validation** | Zod (or equivalent) schema validating platform AI config; invoked at API/service startup; throws on invalid config |
| **Platform client build path** | A domain capability to construct a modeled provider client from platform config (no user credential lookup, no ownership validation) |
| **Call-site re-routing** | Update the call sites listed under "Platform AI" in §4 to use the platform client; confirm "User AI" sites remain on user credentials |
| **Provider alignment** | Platform provider value constrained to the subset of `AiIntegrationProvider`: `gemini`, `deep_seek`, `lm_studio` |
| **Logging** | Structured logs distinguishing platform-credential vs user-credential invocations and a fatal startup log on invalid config |
| **Docs amendments** | Update `task-title-generator` and `specialization` PRD credential statements (see §11) |
| **CD pipeline note** | `PLATFORM_AI_*` must be provisioned in deploy environments before release |

### 3.2 Out-of-Scope (v1)

| Item | Notes |
|------|-------|
| Platform config admin UI | Env-only |
| Billing / quota / rate limiting for platform AI | Operator-absorbed |
| Skill execution LLM routing | Defer until skill LLM exists |
| Live provider health check at boot | Schema validation only |
| Migrating historical tasks | Forward-only behavior |
| Removing the legacy `deepSeekAi` config block | May be deprecated; removal tracked separately (see §12 Q-4) |

---

## 4. Routing Principle & Call-Site Table

### 4.1 Routing Principle (Authoritative)

> **Platform AI** is used **only** for work that benefits the **platform**, not the user.
> - **All task-related work** → **user** AI integration.
> - **Direct user invoke** of an agent from the UI → **user** credential.
> - **Internal platform operations** (shared catalog building, platform agent enrichment, platform-owned background generation) → **platform** credential.

### 4.2 Platform AI Call Sites

| # | Operation | Path | Current source | Target source |
|---|-----------|------|----------------|---------------|
| P-1 | **Task title generation** | `services/task/src/handlers/generateTaskTitle/index.ts` | User preference credential | **Platform** |
| P-2 | **Specialization classification** | `services/agent/src/internalTools/classifySpecialization/index.ts` | User preference credential | **Platform** |
| P-3 | **MCP → specialization mapping** | `services/agent/src/internalTools/createSpecialization/mapMcpsToSpecialization.ts` | User preference credential | **Platform** |
| P-4 | **Specialization agent description generation** | `services/agent/src/internalTools/createSpecialization/generateSpecializationAgentDescriptions.ts` | User preference credential | **Platform** |
| P-5 | **Platform agent catalog create/edit LLM assist** | System agent admin flows (`domains/system-agent`, `apps/api` system-agent routes) | n/a / user | **Platform** |
| P-6 | **Future skill LLM** | Not yet implemented | n/a | **Platform** (out of scope until built) |

### 4.3 User AI Call Sites

| # | Operation | Path | Source (unchanged) |
|---|-----------|------|--------------------|
| U-1 | **Task execution** | `services/task/src/handlers/executeTask/index.ts` | **User** preference credential |
| U-2 | **Task specialization classification orchestrator** | `services/task/src/handlers/executeTask/runTaskSpecializationClassification.ts` | **User** (see §4.4 nesting note) |
| U-3 | **Task category generation** | `services/task/src/handlers/generateTaskCategory/index.ts` | **User** preference credential |
| U-4 | **`useAgent` internal tool (agent-invokes-agent)** | `services/agent/src/internalTools/` (use-agent tool) | **User** |
| U-5 | **Personal agent invoke** | `services/agent/src/handlers/invokePersonalAgent/index.ts` | **User** (agent's own credential / preference) |
| U-6 | **Explicit user invoke of system agent from UI** | `services/agent/src/handlers/invokeSystemAgent/index.ts` ← `apps/api/src/routes/system-agents/invoke.ts` | **User** preference credential (admin may override) |
| U-7 | **Task-related system agent invocations** | `runAgentInvokeWithTools` when invoked from a task flow | **User** preference credential |

### 4.4 Nested-Flow Clarification (Decision Required)

`runTaskSpecializationClassification` (U-2) is an **orchestrator** that makes **no direct LLM call** — it delegates to `classifySpecializationToolHandler` (P-2) and `createSpecializationToolHandler`, which in turn trigger `mapMcpsToSpecialization` (P-3) and `generateSpecializationAgentDescriptions` (P-4). The authoritative requirement lists the orchestrator under **User AI** but its delegated LLM operations under **Platform AI**.

**Recommended resolution (for architect to confirm):** Route **at the actual LLM call site**, by operation, not by the triggering flow. The specialization catalog (specializations, their provisioned agents, MCP mappings, generated descriptions) is a **platform-shared asset**, so its LLM work uses **platform** credentials even when triggered from a user's task. Because U-2 issues no LLM call of its own, its "User AI" classification has no direct invocation to bind to and is effectively a pass-through. This is captured as [Q-1](#12-open-questions--decisions).

---

## 5. Functional Requirements

### 5.1 Platform Client Construction

| ID | Requirement |
|----|-------------|
| FR-1 | The system MUST provide a way to build a modeled provider client from `config.platformAi` (`provider`, `apiKey`, `baseUrl`, `model`, optional `organizationId`) **without** looking up a stored AI integration credential and **without** per-user ownership validation. |
| FR-2 | The platform client MUST use `config.platformAi.defaultModel` as the model unless a call site explicitly overrides it (no per-call override is required in v1). |
| FR-3 | Per the domain/service layering rules, the platform client MUST be constructed inside the `ai-integration` domain (clients live in domains; services never import `@vassembly/client-*` directly). Services request the platform client through a domain command/query. |
| FR-4 | For `provider = lm_studio`, the client MUST be buildable **without** an API key (consistent with existing `resolveAndBuildClient` behavior, which only requires `encryptedApiKey` for non-`lm_studio` providers). |

### 5.2 Call-Site Routing

| ID | Requirement |
|----|-------------|
| FR-5 | Each call site in §4.2 (Platform AI) MUST resolve its model client from **platform** config, not from `getPreferenceByUserId(...).integrationCredentialId`. |
| FR-6 | Each call site in §4.3 (User AI) MUST continue to resolve its model client from the **user's** credential exactly as today; this feature MUST NOT change user-path behavior. |
| FR-7 | Platform-routed call sites MUST NOT skip or fail due to a **missing user credential**. The current "missing_credential" skip/guard logic at those sites MUST be removed or bypassed for the platform path. |
| FR-8 | Platform-routed call sites MUST still degrade safely on **platform** provider failure following each site's existing failure contract (e.g., title generation fails silently; specialization classification skips; task execution is unaffected). |
| FR-9 | The `userId` MUST still be passed through platform-routed operations for **logging, ownership of resulting data, and tool context**, even though it is not used to resolve the credential. |

### 5.3 Provider Support

| ID | Requirement |
|----|-------------|
| FR-10 | `config.platformAi.provider` MUST be one of `gemini`, `deep_seek`, `lm_studio` (a subset of `AiIntegrationProvider`). Any other value is invalid config (see §7). |
| FR-11 | The platform provider value MUST reuse the `AiIntegrationProvider` constant values (no new provider enum). |
| FR-12 | `lm_studio` MUST be accepted as a valid platform provider in **all** environments (development, production, testing). |

---

## 6. Config & Environment Contract

### 6.1 New Environment Variables

| Env var | Required | Applies to | Description |
|---------|----------|------------|-------------|
| `PLATFORM_AI_PROVIDER` | **Yes** | all envs | One of `gemini`, `deep_seek`, `lm_studio`. |
| `PLATFORM_AI_API_KEY` | Conditional | all envs | Required when `PLATFORM_AI_PROVIDER ≠ lm_studio`. May be empty/omitted for `lm_studio`. |
| `PLATFORM_AI_BASE_URL` | Conditional | all envs | Required for `lm_studio` and `deep_seek`; optional for `gemini` (provider default used when absent). |
| `PLATFORM_AI_DEFAULT_MODEL` | **Yes** | all envs | Default model id used for all platform AI invocations. |
| `PLATFORM_AI_ORGANIZATION_ID` | No | all envs | Optional organization id passed to providers that support it. |

### 6.2 Config Shape

Add a provider-agnostic block to `Config` (`packages/config/src/types.ts`):

```typescript
export interface PlatformAiConfig {
  provider: string;            // AiIntegrationProvider value: 'gemini' | 'deep_seek' | 'lm_studio'
  apiKey: string;              // empty allowed only when provider === 'lm_studio'
  baseUrl: string;             // required for lm_studio & deep_seek
  defaultModel: string;        // PLATFORM_AI_DEFAULT_MODEL
  organizationId?: string;     // optional
}

export interface Config {
  // ...existing fields
  platformAi: PlatformAiConfig;
}
```

Wire it in each environment file (`development.ts`, `production.ts`, `e2e.ts`):

```typescript
platformAi: {
  provider: process.env.PLATFORM_AI_PROVIDER || '',
  apiKey: process.env.PLATFORM_AI_API_KEY || '',
  baseUrl: process.env.PLATFORM_AI_BASE_URL || '',
  defaultModel: process.env.PLATFORM_AI_DEFAULT_MODEL || '',
  organizationId: process.env.PLATFORM_AI_ORGANIZATION_ID,
},
```

### 6.3 Relationship to Legacy `deepSeekAi`

| Aspect | Decision |
|--------|----------|
| `config.deepSeekAi` / `DEEP_SEEK_AI_*` | **Superseded** by `config.platformAi` / `PLATFORM_AI_*`. New code MUST read `config.platformAi`. |
| Removal of legacy block | Tracked as follow-up ([Q-4](#12-open-questions--decisions)); not required to ship v1. Until removed, do not add new readers of `deepSeekAi`. |

### 6.4 Validity Matrix

| Provider | `PLATFORM_AI_API_KEY` | `PLATFORM_AI_BASE_URL` | `PLATFORM_AI_DEFAULT_MODEL` | Valid? |
|----------|-----------------------|------------------------|-----------------------------|--------|
| `gemini` | present | optional | present | ✅ |
| `gemini` | missing | — | present | ❌ (missing key) |
| `deep_seek` | present | present | present | ✅ |
| `deep_seek` | present | missing | present | ❌ (missing base URL) |
| `lm_studio` | empty/omitted | present | present | ✅ |
| `lm_studio` | present | missing | present | ❌ (missing base URL) |
| any | — | — | missing | ❌ (missing default model) |
| unknown value | — | — | — | ❌ (invalid provider) |

---

## 7. Bootstrap Validation Requirements

| ID | Requirement |
|----|-------------|
| BV-1 | At application start (API gateway boot, and any service entrypoint that performs platform AI work), the platform AI config MUST be validated against a schema **before** the server begins accepting requests. |
| BV-2 | Validation MUST enforce the [Validity Matrix](#64-validity-matrix): valid provider value; `defaultModel` non-empty; `apiKey` non-empty unless provider is `lm_studio`; `baseUrl` non-empty for `lm_studio` and `deep_seek`. |
| BV-3 | On invalid config, startup MUST **fail fast**: throw a descriptive error and exit with a non-zero code. The app MUST NOT start in a degraded/partial state. (No graceful skip.) |
| BV-4 | The startup failure log MUST identify the offending field(s) (e.g., `PLATFORM_AI_DEFAULT_MODEL is required`) without printing secret values. The API key value MUST NOT be logged. |
| BV-5 | Validation MUST NOT perform a live provider request/ping in v1 (schema-only). |
| BV-6 | `lm_studio` MUST pass validation in all environments including production. |
| BV-7 | The CD/deploy pipeline MUST provision all required `PLATFORM_AI_*` variables in each environment **before** deploying this change, or the deployment will fail fast at boot (operational risk — see §15). |

---

## 8. Edge Cases & Error Handling

| # | Condition | Expected Behavior |
|---|-----------|-------------------|
| E-1 | `PLATFORM_AI_*` not set in environment | App **fails to start** with a descriptive error naming the missing variable(s). |
| E-2 | `PLATFORM_AI_PROVIDER` = unsupported value (e.g. `chatgpt`, `anthropic`, `foo`) | Startup validation fails; app does not start. (Only `gemini`/`deep_seek`/`lm_studio` permitted for platform.) |
| E-3 | `PLATFORM_AI_PROVIDER = lm_studio`, no API key | Valid; app starts and platform client builds without a key. |
| E-4 | `PLATFORM_AI_PROVIDER = lm_studio`, no base URL | Startup validation fails (base URL required for lm_studio). |
| E-5 | Platform provider returns an error during **title generation** (P-1) | Title stays `null`; failure logged; task create and execution unaffected (existing silent-failure contract). |
| E-6 | Platform provider returns an error during **specialization classification** (P-2) | Classification skipped/failed and logged; task execution continues (existing contract). |
| E-7 | User has **no** AI integration, creates a task | Task **title** (P-1) and **specialization catalog** work (P-2–P-4) still run via platform credential; **task execution** (U-1) still fails with `MISSING_CREDENTIAL` per existing behavior. |
| E-8 | User has a valid AI integration | User-path call sites (U-*) use the user's credential; platform-path sites (P-*) use platform credential regardless. |
| E-9 | Platform-path operation triggered for a deleted/invalid downstream entity | Fails safely per the site's existing contract; no user-facing error attributable to credential routing. |
| E-10 | `generateSpecializationAgentDescriptions` (P-4) runs but platform provider is down | Per existing fire-and-forget contract: logged, agents keep empty descriptions, no rollback. |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Requirement | Target |
|-------------|--------|
| Startup overhead from config validation | Negligible (synchronous, in-memory schema parse) |
| Platform-path latency | No regression vs. the equivalent user-path invocation today |

### 9.2 Security

| Requirement | Behavior |
|-------------|----------|
| Secret handling | `PLATFORM_AI_API_KEY` MUST NOT be logged or included in error messages or responses. |
| Tenant isolation | Platform-routed operations MUST NOT expose platform credentials to user-facing responses; only resulting domain data (titles, specializations) is returned. |
| No cross-user leakage | Platform credential is global infrastructure; results are still written under the originating `userId`/owner where applicable. |

### 9.3 Observability

| Event | Level | Fields |
|-------|-------|--------|
| `platform_ai.config.invalid` | fatal/error | offending field name(s), environment (no secret values) |
| LLM invocation (platform path) | info | call-site id, `credentialSource: "platform"`, `provider`, `model`, `userId` |
| LLM invocation (user path) | info | call-site id, `credentialSource: "user"`, `provider`, `model`, `userId` |

### 9.4 Reliability

- Platform AI availability is independent of any individual user's credential state.
- A platform provider outage degrades **platform** features (titles, catalog enrichment) per their existing silent/skip contracts but MUST NOT block task creation or user-path execution.

---

## 10. Gherkin Acceptance Scenarios

### 10.1 Bootstrap Validation

```gherkin
Feature: Platform AI config bootstrap validation

Scenario: App starts with valid platform AI config
  Given PLATFORM_AI_PROVIDER is "gemini"
  And PLATFORM_AI_API_KEY is set
  And PLATFORM_AI_DEFAULT_MODEL is set
  When the API gateway starts
  Then startup completes
  And the server begins accepting requests

Scenario: App fails to start when default model is missing
  Given PLATFORM_AI_PROVIDER is "gemini"
  And PLATFORM_AI_API_KEY is set
  And PLATFORM_AI_DEFAULT_MODEL is empty
  When the API gateway starts
  Then startup fails fast with a non-zero exit code
  And the error names PLATFORM_AI_DEFAULT_MODEL as missing
  And no AI API key value is printed in logs

Scenario: App fails to start with an unsupported platform provider
  Given PLATFORM_AI_PROVIDER is "chatgpt"
  When the API gateway starts
  Then startup fails fast
  And the error indicates the provider is not allowed for platform AI

Scenario: lm_studio is valid in production without an API key
  Given NODE_ENV is "production"
  And PLATFORM_AI_PROVIDER is "lm_studio"
  And PLATFORM_AI_BASE_URL is set
  And PLATFORM_AI_DEFAULT_MODEL is set
  And PLATFORM_AI_API_KEY is empty
  When the API gateway starts
  Then startup completes

Scenario: lm_studio without a base URL fails validation
  Given PLATFORM_AI_PROVIDER is "lm_studio"
  And PLATFORM_AI_BASE_URL is empty
  When the API gateway starts
  Then startup fails fast
  And the error names PLATFORM_AI_BASE_URL as required
```

### 10.2 Platform-Routed Call Sites

```gherkin
Feature: Platform AI routing for platform-benefiting work

Scenario: Task title generation uses platform credential
  Given platform AI config is valid
  And I am authenticated with NO AI integration configured
  When I create a task with a non-empty description
  Then title generation runs using the platform AI credential
  And the model used is PLATFORM_AI_DEFAULT_MODEL
  And the user's missing AI integration does not skip title generation

Scenario: Specialization classification uses platform credential
  Given platform AI config is valid
  And a task is created by a user with NO AI integration
  When specialization classification runs for the task
  Then the classification LLM call uses the platform credential
  And it is not skipped for "missing_credential"

Scenario: MCP mapping and agent description generation use platform credential
  Given a new specialization is created during a task flow
  When MCP-to-specialization mapping runs
  And specialization agent description generation runs
  Then both use the platform AI credential
  And neither requires the triggering user's AI integration

Scenario: Platform provider failure does not break task creation
  Given platform AI config is valid
  And the platform provider returns an error
  When I create a task
  Then the task is created successfully
  And the title remains null
  And the failure is logged with credentialSource "platform"
```

### 10.3 User-Routed Call Sites (Unchanged)

```gherkin
Feature: User AI routing for user-benefiting work

Scenario: Task execution uses the user's credential
  Given I am authenticated with a valid AI integration "cred-1"
  When my task executes
  Then the execution LLM client is built from "cred-1"
  And the credentialSource is "user"

Scenario: Task execution still fails without a user credential
  Given I am authenticated with NO AI integration
  When my task executes
  Then the task transitions to failed with errorCode MISSING_CREDENTIAL
  And no platform credential is used for task execution

Scenario: Explicit UI invoke of a system agent uses the user's credential
  Given I am authenticated with a valid AI integration
  When I invoke a system agent from the UI
  Then the invocation uses my user credential
  And the platform credential is not used

Scenario: Personal agent invoke uses the user's credential
  Given I am authenticated and own a personal agent with an AI integration
  When I invoke the personal agent
  Then the invocation uses the user/agent credential
  And the platform credential is not used

Scenario: Task category generation uses the user's credential
  Given I am authenticated with a valid AI integration
  When task category generation runs
  Then it uses my user credential
```

---

## 11. PRD Amendment Notes

These existing PRDs assert a **user-credential** source for operations that this PRD re-routes to **platform**. They MUST be amended (delta-style, do not rewrite history) to reflect platform routing.

### 11.1 `task-title-generator` PRD

| Location | Current statement | Amended statement |
|----------|-------------------|-------------------|
| **AC-3** | "Title generation uses the **'Task title generator'** system agent and **the user's preferred system-call credential**." | "…and the **platform AI credential** (`config.platformAi`). It no longer depends on the user's system-call credential." |
| **FR-B4 (Credential resolution)** | "Load `userSystemAgentPreferences` for `userId`. Use `integrationCredentialId`… If missing, fail silently (`title.generate.missing_credential`)." | "Resolve the **platform** model client from `config.platformAi`. There is **no** user-credential dependency; the `missing_credential` skip path is **removed** for title generation." |
| **E-3 (Missing AI credential)** | "Missing AI credential → skip persist; silent; main `executeTask` may still fail with credential error." | "User's missing AI credential **does not** affect title generation (platform-credentialed). `executeTask` may still fail independently with a credential error." |
| §2.3 / §5.2 idempotency & silent-failure | (unchanged) | Still applies: do not overwrite existing title; platform-provider failure remains silent. |

> Add a Phase note to `task-title-generator` referencing `platform-ai-config` as the credential source of record.

### 11.2 `specialization` PRD

| Location | Current behavior | Amended behavior |
|----------|------------------|------------------|
| `classifySpecialization` "skip on missing credential" | Skips classification when the **user** has no `integrationCredentialId` (`reason: 'missing_credential'`). | Classification runs on the **platform** credential; the **user**-missing-credential skip is **removed** for the platform classify flow. (A `missing_credential` skip may still apply only if the **platform** client cannot be built — but platform config is validated at boot, so this should not occur in normal operation.) |
| `mapMcpsToSpecialization` credential | Uses caller's `connectionOverride` (user credential). | Uses **platform** credential. |
| `generateSpecializationAgentDescriptions` (Δ-FR-AG-1) credential | Uses caller's `connectionOverride` (user credential). | Uses **platform** credential; remains fire-and-forget and non-blocking. |
| `createSpecialization` gating on `integrationCredentialId` | MCP mapping & description generation are skipped entirely when the user has no credential. | Gate on **platform** availability instead of the user's credential; user-credential absence no longer skips catalog enrichment. |

> Add a delta row to the `specialization` PRD "Phase 1.1 — Delta Requirements" table referencing platform routing for P-2/P-3/P-4, and resolve the nesting decision in §4.4 / [Q-1](#12-open-questions--decisions).

---

## 12. Open Questions & Decisions

| ID | Question | Recommendation |
|----|----------|----------------|
| **Q-1** | The authoritative list places `runTaskSpecializationClassification` under **User AI** but its delegated LLM operations (`classifySpecialization`, `mapMcpsToSpecialization`, `generateSpecializationAgentDescriptions`) under **Platform AI**. Which wins at the call site? | **Route by operation at the actual LLM call site.** The orchestrator makes no direct LLM call; catalog-building sub-operations use **platform** credentials. (Confirm with architect.) |
| **Q-2** | What does "Platform agent catalog create/edit operations" (P-5) entail for LLM usage — is there an LLM-assisted create/edit, or is it pure CRUD? | If any LLM assist exists in platform agent create/edit, route it to **platform**. Pure CRUD needs no credential. Clarify scope before implementation. |
| **Q-3** | Should a per-call-site model override be supported, or is a single `PLATFORM_AI_DEFAULT_MODEL` sufficient for v1? | **Single default model** in v1 (per requirements). Add overrides only if a site needs a different model later. |
| **Q-4** | Remove `config.deepSeekAi` / `DEEP_SEEK_AI_*` now or later? | **Later.** Supersede in code now; schedule removal once no readers remain. |
| **Q-5** | Should `gemini` require `PLATFORM_AI_BASE_URL`? | **No** — optional for `gemini` (provider default). Required for `deep_seek` and `lm_studio`. Confirm against `client-langchain` provider defaults. |

---

## 13. Acceptance Criteria (QA Checklist)

| # | Check | Pass Condition |
|---|-------|----------------|
| 1 | Valid config boots | App starts with valid `PLATFORM_AI_*` |
| 2 | Missing model fails boot | App exits non-zero; error names `PLATFORM_AI_DEFAULT_MODEL` |
| 3 | Bad provider fails boot | App exits non-zero for non-`gemini/deep_seek/lm_studio` provider |
| 4 | lm_studio prod ok | Boots in production with base URL, no API key |
| 5 | lm_studio no base URL fails | App exits non-zero |
| 6 | Secret not logged | API key never appears in logs/errors |
| 7 | Title uses platform | Title generated for a user with no AI integration |
| 8 | Classification uses platform | Specialization classify runs without user credential |
| 9 | MCP mapping uses platform | Mapping runs without user credential |
| 10 | Agent descriptions use platform | Descriptions generated without user credential |
| 11 | Execution still user | `executeTask` uses user credential; fails `MISSING_CREDENTIAL` when absent |
| 12 | UI invoke still user | User-invoked system/personal agent uses user credential |
| 13 | Category still user | `generateTaskCategory` uses user credential |
| 14 | Platform failure is safe | Platform provider error does not block task create/execution |
| 15 | Routing logs | Logs show correct `credentialSource` per call site |

---

## 14. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Platform work decoupled from user setup | 100% of P-1…P-4 succeed for users with **no** AI integration (provider healthy) | QA + logs (`credentialSource: "platform"`) |
| Correct routing | 0 user-path sites using platform credential and 0 platform-path sites using user credential | Log audit of `credentialSource` by call-site id |
| Fail-fast config | 100% of invalid platform configs prevent startup (no degraded boots) | Deploy/boot tests |
| No user-path regression | User-path call sites behave identically pre/post change | Regression suite |
| No secret leakage | 0 occurrences of `PLATFORM_AI_API_KEY` value in logs | Log scan |
| Cost attribution shift | Platform-benefiting LLM spend moves off user credentials | Provider/billing dashboards (operator) |

---

## 15. Dependencies

### 15.1 Required Existing Systems

| Dependency | Relationship |
|------------|--------------|
| `@vassembly/config` | Hosts new `platformAi` config block + env wiring |
| `domains/ai-integration` | Builds modeled provider client; new platform-from-config build path lives here (`getModeledProviderClient`) |
| `AiIntegrationProvider` constants | Source of valid provider values (`gemini`, `deep_seek`, `lm_studio`) |
| `packages/client-langchain` | Underlying provider client (consumed only via the ai-integration domain) |
| `services/task`, `services/agent` | Host the re-routed call sites (P-1…P-4) |
| `apps/api` | Boot-time validation entrypoint (BV-1) |
| `@vassembly/logger`, `@vassembly/errors` | Routing logs and fatal config errors |

### 15.2 Operational / CD Risk

| Risk | Mitigation |
|------|------------|
| **`PLATFORM_AI_*` not provisioned before deploy** → app fails fast at boot (intended, but causes an outage if missed) | Add `PLATFORM_AI_*` to the CD pipeline secrets/vars for **every** environment **before** merging/deploying this change. Validate in a staging deploy first. |
| Provider/model mismatch (e.g., default model not available for chosen provider) | v1 does not ping providers; verify provider+model manually in staging. Consider a future health check ([Non-Goals](#22-non-goals)). |

### 15.3 Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| **End users** | Get titles/classification without configuring AI; stop paying for platform work |
| **Platform operators** | Own and fund platform AI; need correct cost attribution |
| **DevOps** | Must provision `PLATFORM_AI_*` in CD before deploy to avoid fail-fast outages |

---

*End of PRD — ready for architecture and implementation planning.*
