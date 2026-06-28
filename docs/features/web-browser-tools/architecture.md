# Web Browser Tools — Implementation Architecture

**Status:** Implemented  
**Last updated:** 2026-06-27  
**Related:** [Agent Internal Tools](../agent-internal-tools/architecture.md) · [System Agent](../system-agent/architecture.md)

This document defines the architecture for adding two new internal tools — **`web-search`** and **`web-page-content`** — to the vassembly internal tool registry. Both tools are assigned to all three specialization agent roles (researcher, worker, validator) at provisioning time.

**Cost constraint:** Both tools must be **fully free with no per-request billing**, regardless of invocation volume. Paid third-party search APIs (e.g. Brave Search API) are **out of scope**. All network I/O uses Node's built-in `fetch` against public HTML endpoints; no API keys are required.

---

## Analysis

### Audit of existing code

| Area | Package / path | Current capability | Reuse for this feature |
|------|----------------|-------------------|------------------------|
| Internal tool registry | `@vassembly/constants/src/internalTools/registry.ts` | 8 tools registered via `defineInternalTool` factory | **Extend** — add 2 new entries following identical pattern |
| LangChain tool factories | `@vassembly/client-langchain/src/internalTools/` | `buildInternalTools` + `INTERNAL_TOOL_SCHEMAS` map + 8 schemas | **Extend** — add 2 schema files; add 2 entries to map in `buildInternalTools` |
| Handler wiring | `services/agent/src/internalTools/createInternalToolHandlers.ts` | Creates `InternalToolHandlerMap` from all 8 handlers | **Extend** — add 2 entries following identical pattern |
| Handler structure | `services/agent/src/internalTools/listAgents/`, `useAgent/`, etc. | Folder-per-handler: `index.ts`, `types.ts`, `index.test.ts` | **Mirror** exactly for new handlers |
| Provisioning | `services/agent/src/internalTools/createSpecialization/provisionSpecializationAgents.ts` | Creates agents with `assignedToolIds: []` | **Modify** — populate `assignedToolIds` with new tool IDs |
| Agent role constants | `services/agent/src/internalTools/createSpecialization/constants.ts` | `SPECIALIZATION_AGENT_RULES` per role | **Modify** — optionally extend rules; reference new tool IDs |
| Brave Search MCP | `brave-search-mcp` (MCP server, user-configured) | Exists as optional MCP integration with paid API key | **Not reused** — internal tools are platform-provided and must not depend on user MCP config or paid APIs |
| Client package pattern | `@vassembly/client-file` | Thin HTTP / filesystem wrapper | **Pattern** — new `client-web` package for fetch-based search + page extraction |

### What can be reused (~80%)

| Layer | Reuse | Evidence |
|-------|-------|----------|
| Registry `defineInternalTool` factory | **100%** | Identical call signature; zero change to factory |
| `buildInternalTools` wiring | **90%** | Only add entries to `INTERNAL_TOOL_SCHEMAS` map |
| `createInternalToolHandlers` wiring | **90%** | Only add 2 handler entries to map |
| Folder/file handler pattern | **100%** | `index.ts` + `types.ts` + `index.test.ts` per handler |
| Schema pattern (Zod + `DynamicStructuredTool`) | **100%** | Copy from `useAgentSchema.ts` / `listAgentsSchema.ts` |
| Provisioning loop | **90%** | Modify `assignedToolIds: []` to `assignedToolIds: SPECIALIZATION_AGENT_TOOL_IDS` |
| `InternalToolContext` | **100%** | Handlers receive existing context; no new fields needed |
| Error/return string contract | **100%** | Handlers return `Promise<string>`; serialize as JSON |

### What must be new (~20%)

| Gap | Placement |
|-----|-----------|
| 2 registry entries (`web-search`, `web-page-content`) | `packages/constants/src/internalTools/registry.ts` |
| 2 Zod schemas | `packages/client-langchain/src/internalTools/schemas/` |
| 2 handler folders | `services/agent/src/internalTools/webSearch/`, `webPageContent/` |
| Shared fetch-based web client | `packages/client-web/` (new `client-*` package) |
| Backfill of `assignedToolIds` on existing specialization agents | One-time script in `services/agent/` |

### New packages required

**One new client package:** `@vassembly/client-web`.

Rationale:

- Both tools are pure HTTP fetch + HTML parsing — no persistence, no paid APIs.
- A single client keeps search and page extraction logic testable, DRY, and isolated from handler ceremony.
- Services import the client directly for both handlers (documented exception to the "no service → client-*" rule, same rationale as `@vassembly/client-file` in script storage).
- **No new domain required.** No business logic beyond fetch/parse; a domain would add unjustified ceremony.

> **Brave Search API is explicitly excluded.** Brave's REST API requires a subscription token and has usage-based pricing beyond the free tier. User-facing Brave Search MCP (with user-supplied API key) remains unchanged — it is a separate, optional integration.

### Design patterns applied

- **Registry / Static Catalog (Flyweight variant):** The existing `defineInternalTool` factory and `INTERNAL_TOOL_REGISTRY` map embody the Flyweight pattern — shared metadata objects referenced by id.
- **Handler Map (Strategy pattern):** `createInternalToolHandlers` returns a `Record<string, InternalToolHandler>` map — a Strategy dispatch table.
- **Factory Method:** `buildInternalTools` constructs `DynamicStructuredTool` instances from metadata + schema + handler.
- **Facade:** Handler functions act as Facades over `@vassembly/client-web`, presenting a simple `(args) => Promise<string>` interface to the LLM runtime.

---

## Architecture & Package Placement

### Package / file placement table

| Package | Type | New / modified paths | Responsibility |
|---------|------|----------------------|----------------|
| `@vassembly/constants` | extend | `src/internalTools/registry.ts` | Add 2 tool definitions |
| `@vassembly/client-web` | **new client package** | `src/webSearchClient.ts`, `src/pageContentClient.ts`, `src/htmlExtraction.ts`, `src/types.ts`, `src/index.ts` | Fetch-based web search + page content extraction (no API keys) |
| `@vassembly/client-langchain` | extend | `src/internalTools/schemas/webSearchSchema.ts`, `webPageContentSchema.ts`, `src/internalTools/buildInternalTools.ts` | Add 2 Zod schemas; register in schema map |
| `@vassembly/service-agent` | extend | `src/internalTools/webSearch/`, `webPageContent/`, `createInternalToolHandlers.ts`, `createSpecialization/` | Handler business logic; provisioning backfill |

### Tool ID, `llmToolName`, and `accessScope` decisions

| Property | `web-search` | `web-page-content` |
|----------|-------------|-------------------|
| `id` (registry) | `web-search` | `web-page-content` |
| `domain` (for `defineInternalTool`) | `web` | `web` |
| `action` (for `defineInternalTool`) | `search` | `page-content` |
| `displayName` (auto-generated) | `Web Search` | `Web Page Content` |
| `llmToolName` | `web_search` | `web_page_content` |
| `accessScope` | `SYSTEM_AND_PERSONAL` | `SYSTEM_AND_PERSONAL` |
| Description | `Search the web and return a list of results (title, URL, and snippet)` | `Fetch a web page and return its main text content, plus links to any images and videos found` |

**`accessScope` rationale:** Both tools are pure read operations with no privileged system data. `SYSTEM_AND_PERSONAL` matches `agent-use` and `agent-list`.

**ID generation:** `formatInternalToolId({ domain: 'web', action: 'search' })` → `web-search`. `formatInternalToolId({ domain: 'web', action: 'page-content' })` → `web-page-content`. Verify the existing `formatInternalToolId` function handles hyphenated actions; if not, pass `id` directly.

### High-level data flow — invoke runtime

```
LLM tool call: web_search / web_page_content
    ↓
runToolCallLoop (client-langchain)
    ↓
DynamicStructuredTool.func (built by buildInternalTools)
    ↓
InternalToolHandler from createInternalToolHandlers
    ├── webSearch handler → webSearchClient.search() → JSON result string
    └── webPageContent handler → pageContentClient.fetch() → JSON result string
```

No new service layers, no new domains, no changes to the invoke engine, API gateway, or UI.

### Cross-package dependency rules

- `services/agent` imports `@vassembly/client-web` directly in both handlers (documented exception — stateless HTTP, no domain ownership).
- `client-langchain` does not import services — handlers remain injected.
- No circular dependencies introduced.

---

## Domain Client Design: `@vassembly/client-web`

A single free, fetch-based client package shared by both tools. **No API keys. No paid services.**

### Package structure

```
packages/client-web/
├── src/
│   ├── types.ts               # WebSearchResult, WebPageContentResult, client config types
│   ├── htmlExtraction.ts      # Shared: parse HTML, strip noise, extract text/images/videos
│   ├── webSearchClient.ts     # createWebSearchClient factory + search()
│   ├── pageContentClient.ts   # createPageContentClient factory + fetch()
│   └── index.ts               # exports
├── package.json
├── tsconfig.json
└── README.md
```

**Dependency:** `node-html-parser` (~50KB, zero native deps) for HTML parsing in both search-result extraction and page content extraction.

### Web search — free HTML-based approach

Instead of a paid search API, `webSearchClient` fetches a **public HTML search results page** and parses structured results from the response.

**Provider:** DuckDuckGo HTML Lite (`https://html.duckduckgo.com/html/`)

| Property | Value |
|----------|-------|
| Cost | Free — no API key, no account |
| Method | `POST` with `q=<query>` form body (DDG HTML endpoint convention) |
| Parsing | `node-html-parser` — extract result blocks: title (`<a class="result__a">`), URL (`href`), snippet (`<a class="result__snippet">`) |
| Default `maxResults` | 5 |

**Why DuckDuckGo HTML Lite:**

- No authentication or billing.
- Designed for lightweight/HTML clients (no JavaScript rendering required).
- Widely used in open-source fetch-based search clients.

**Trade-offs (documented, accepted):**

- HTML structure may change — parser is isolated in `webSearchClient.ts` for easy updates; unit tests use fixture HTML.
- Search engines may rate-limit or block high-volume server IPs — mitigate with standard `User-Agent`, request timeouts, and observability logging (not billing).
- Result quality may differ from paid APIs — acceptable for agent research use case.

**Alternative considered — SearXNG:** Requires self-hosting infrastructure; rejected for v1 to avoid ops burden. Can be added as a configurable backend in v2 if needed.

### Interface design

```typescript
// types.ts
export interface WebSearchClientConfig {
  maxResults?: number;
  userAgent?: string;
  fetchFn?: typeof fetch;   // injectable for tests
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
}

export interface PageContentClientConfig {
  maxBytes?: number;        // default 2MB
  userAgent?: string;
  fetchFn?: typeof fetch;
}

export interface WebPageContentResult {
  url: string;
  text: string;
  images: string[];
  videos: string[];
}

// webSearchClient.ts
export interface WebSearchClient {
  search: ({ query }: { query: string }) => Promise<WebSearchResponse>;
}

export const createWebSearchClient = (config?: WebSearchClientConfig): WebSearchClient => {
  // POST https://html.duckduckgo.com/html/ with q=query
  // Parse HTML → WebSearchResult[] (capped at maxResults)
};

// pageContentClient.ts
export interface PageContentClient {
  fetch: ({ url }: { url: string }) => Promise<WebPageContentResult>;
}

export const createPageContentClient = (config?: PageContentClientConfig): PageContentClient => {
  // GET url → htmlExtraction.extractPageContent(html, baseUrl)
};
```

### Shared HTML extraction (`htmlExtraction.ts`)

Used by `pageContentClient` directly; `webSearchClient` uses targeted selectors for result blocks only.

**Page content extraction steps:**

1. Parse HTML with `node-html-parser`
2. Remove `<script>`, `<style>`, `<nav>`, `<header>`, `<footer>`, `<aside>` elements
3. Extract body inner text; normalize whitespace
4. Collect `<img src>`, `<video src>`, and `<source src>` attributes
5. Resolve relative URLs against base URL via `new URL(relative, base).href`

**Security (both clients):**

- HTTPS-only URLs for `pageContentClient` (reject `http:`, `file:`, etc.)
- Deny private/reserved IP ranges before fetch (SSRF guard)
- Enforce `Content-Length` / response size cap (default 2MB)
- Request timeout (default 10s)

**No environment variables required** for either tool — zero config beyond optional tuning constants in client config.

---

## Handler Flow

### `web-search` handler

**File:** `services/agent/src/internalTools/webSearch/index.ts`

```
Input args (from Zod schema): { query: string }
1. createWebSearchClient({ maxResults: 5 })
2. client.search({ query })
3. Return JSON.stringify(results)
```

**LLM schema** (`webSearchSchema.ts`):
```typescript
z.object({
  query: z.string().min(1),
})
```

### `web-page-content` handler

**File:** `services/agent/src/internalTools/webPageContent/index.ts`

```
Input args (from Zod schema): { url: string }
1. Validate url is a valid HTTPS URL
2. createPageContentClient()
3. client.fetch({ url })
4. Return JSON.stringify({ url, text, images, videos })
```

**LLM schema** (`webPageContentSchema.ts`):
```typescript
z.object({
  url: z.string().url(),
})
```

**Error handling (both handlers):** Network errors, parse failures, SSRF blocks, and non-200 responses return a user-safe error string (e.g., `"Unable to search the web: <reason>"`). Never throw — LLM tools must return strings.

---

## Provisioning & Backfill Strategy

### New specialization agents (forward-looking)

Modify `provisionSpecializationAgents.ts` — change `assignedToolIds: []` to:

```typescript
import { SPECIALIZATION_AGENT_TOOL_IDS } from './constants';

// in the create call:
assignedToolIds: SPECIALIZATION_AGENT_TOOL_IDS,
```

Add to `constants.ts`:

```typescript
export const SPECIALIZATION_AGENT_TOOL_IDS: string[] = ['web-search', 'web-page-content'];
```

All future specialization agents (researcher, worker, validator) automatically receive both tools.

### Existing specialization agents (backfill)

Existing specialization agents were provisioned with `assignedToolIds: []`. They need a one-time backfill.

**Strategy: migration script** (preferred over a handler or API call loop):

**File:** `services/agent/src/internalTools/createSpecialization/backfillSpecializationAgentTools.ts`

```typescript
// Called once from a CLI or admin endpoint
// 1. Query all system agents with specializationId != null
// 2. For each agent: call systemAgentDomain.commands.update({ assignedToolIds: SPECIALIZATION_AGENT_TOOL_IDS })
// 3. Log count updated
```

**Execution:** Run as a one-off Node script via `tsx` in CI or from an admin API endpoint. Do not run automatically on startup.

**Idempotency:** Skip agents whose `assignedToolIds` already includes both tool IDs.

---

## Test Plan

### Unit tests by layer

| Layer | Test file | Critical cases |
|-------|-----------|---------------|
| `@vassembly/constants` | `src/internalTools/registry.test.ts` (extend) | `web-search` and `web-page-content` entries exist; `llmToolName` correct; `accessScope` is `SYSTEM_AND_PERSONAL` |
| `@vassembly/client-web` | `src/webSearchClient.test.ts` | Parses fixture DDG HTML → title/url/snippet; respects `maxResults`; handles empty results |
| `@vassembly/client-web` | `src/pageContentClient.test.ts` | Strips HTML; extracts images/videos; relative URL resolution; SSRF block; size cap |
| `@vassembly/client-web` | `src/htmlExtraction.test.ts` | Shared extraction logic in isolation |
| `@vassembly/client-langchain` | `src/internalTools/buildInternalTools.test.ts` (extend) | Both schemas present; correct `llmToolName`; skipped when no handler |
| `services/agent` — `webSearch` | `src/internalTools/webSearch/index.test.ts` | Returns JSON array; client error → error string |
| `services/agent` — `webPageContent` | `src/internalTools/webPageContent/index.test.ts` | Returns JSON object; invalid URL → error string |
| `services/agent` — provisioning | `provisionSpecializationAgents.test.ts` (extend) | New agents include both tool IDs in `assignedToolIds` |
| `services/agent` — backfill | `backfillSpecializationAgentTools.test.ts` | Updates missing; skips already-set; returns count |

### What is NOT tested at unit level

- Live DuckDuckGo or target website network behavior (integration/e2e only)
- End-to-end LLM tool-call loop (covered by existing `invokeWithChatModel.test.ts` pattern)

### Test approach

- Mock `fetch` in all `client-web` tests (fixture HTML responses)
- Mock `@vassembly/client-web` in handler tests (`vi.mock`)
- Black-box input → output validation only

---

## Implementation Phases

### Phase overview

| Phase | Scope | Key deliverable |
|-------|-------|-----------------|
| **P1 — Client package** | `@vassembly/client-web` | Fetch-based search + page content client; shared HTML extraction |
| **P2 — Registry entries** | `@vassembly/constants` | 2 new tool definitions in registry |
| **P3 — Schemas** | `@vassembly/client-langchain` | 2 Zod schemas + `buildInternalTools` map entries |
| **P4 — Handlers** | `services/agent` | `webSearch` + `webPageContent` handler folders; wiring in `createInternalToolHandlers` |
| **P5 — Provisioning** | `services/agent` | Update `constants.ts` + `provisionSpecializationAgents.ts`; backfill script |

**Dependency graph:**

```
P1 (client-web)
    ↓
P2 (registry) ──→ P3 (schemas) ──→ P4 (handlers) ──→ P5 (provisioning)
                                         ↑
                                    P1 (client-web)
```

P2 and P1 can run in parallel. P3 needs P2. P4 needs P1 + P3. P5 needs P4.

### P1 — Client package (file-level)

| File | Action |
|------|--------|
| `packages/client-web/package.json` | **Create** — `name: "@vassembly/client-web"`, deps: `node-html-parser` |
| `packages/client-web/tsconfig.json` | **Create** — mirror `client-file/tsconfig.json` |
| `packages/client-web/src/types.ts` | **Create** — shared result + config types |
| `packages/client-web/src/htmlExtraction.ts` | **Create** — parse, strip noise, extract text/media URLs |
| `packages/client-web/src/webSearchClient.ts` | **Create** — DDG HTML fetch + result parsing |
| `packages/client-web/src/pageContentClient.ts` | **Create** — page fetch + `htmlExtraction` |
| `packages/client-web/src/index.ts` | **Create** — re-export factories + types |
| `packages/client-web/src/*.test.ts` | **Create** — unit tests with mocked fetch + fixture HTML |

### P2 — Registry entries (file-level)

| File | Action |
|------|--------|
| `packages/constants/src/internalTools/registry.ts` | **Modify** — add 2 `defineInternalTool` entries |

### P3 — Schemas (file-level)

| File | Action |
|------|--------|
| `packages/client-langchain/src/internalTools/schemas/webSearchSchema.ts` | **Create** |
| `packages/client-langchain/src/internalTools/schemas/webPageContentSchema.ts` | **Create** |
| `packages/client-langchain/src/internalTools/buildInternalTools.ts` | **Modify** — add 2 map entries |

### P4 — Handlers (file-level)

| File | Action |
|------|--------|
| `services/agent/src/internalTools/webSearch/` | **Create** — `types.ts`, `index.ts`, `index.test.ts` |
| `services/agent/src/internalTools/webPageContent/` | **Create** — `types.ts`, `index.ts`, `index.test.ts` |
| `services/agent/src/internalTools/createInternalToolHandlers.ts` | **Modify** — add 2 entries |
| `services/agent/package.json` | **Modify** — add `@vassembly/client-web` |

### P5 — Provisioning (file-level)

| File | Action |
|------|--------|
| `services/agent/src/internalTools/createSpecialization/constants.ts` | **Modify** — add `SPECIALIZATION_AGENT_TOOL_IDS` |
| `services/agent/src/internalTools/createSpecialization/provisionSpecializationAgents.ts` | **Modify** |
| `services/agent/src/internalTools/createSpecialization/backfillSpecializationAgentTools.ts` | **Create** |
| Provisioning tests | **Modify / create** |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DuckDuckGo HTML structure changes | Search parsing breaks | Isolate selectors in `webSearchClient.ts`; fixture-based tests; fast patch path |
| Search engine rate limiting / IP blocks | Intermittent search failures | Standard User-Agent, timeouts, logging; return clear error strings to LLM |
| HTML parser strips too much page content | Poor text extraction | Tune element removal list; consider `@extractus/article-extractor` as v2 upgrade |
| `formatInternalToolId` does not support hyphenated action (`page-content`) | Registry ID malformed | Verify output; use explicit `id` override if needed |
| Existing specialization agents not backfilled | Agents lack tools until backfill runs | Idempotent backfill script; run immediately after deploy |
| `web-page-content` fetches malicious or oversized pages | Memory / SSRF risk | HTTPS-only, private IP denylist, 2MB size cap, 10s timeout |
| Search result quality vs paid APIs | Less precise snippets | Acceptable for v1; users can still configure Brave Search MCP separately |

---

## Todo Plan

1. **`@vassembly/client-web`** — [Type: new client package]
   - Changes needed: Fetch-based web search (DDG HTML) + page content extraction; shared `htmlExtraction`
   - Files to create: `package.json`, `tsconfig.json`, `src/types.ts`, `htmlExtraction.ts`, `webSearchClient.ts`, `pageContentClient.ts`, `index.ts`, tests
   - Suggested subagent workflow: `tdd-unit-test-writer → coder → Done`
   - Dependencies: None (can start immediately)

2. **`@vassembly/constants`** — [Type: extend utility]
   - Changes needed: Add `web-search` and `web-page-content` registry entries
   - Dependencies: None (parallel with Todo 1)

3. **`@vassembly/client-langchain`** — [Type: extend]
   - Changes needed: Add schemas; register in `buildInternalTools`
   - Dependencies: Todo 2

4. **`@vassembly/service-agent` (handlers)** — [Type: extend service]
   - Changes needed: Implement handlers; wire `createInternalToolHandlers`; add `@vassembly/client-web` dep
   - Dependencies: Todos 1, 3

5. **`@vassembly/service-agent` (provisioning)** — [Type: extend service]
   - Changes needed: `SPECIALIZATION_AGENT_TOOL_IDS`, provisioning update, backfill script
   - Dependencies: Todo 2

---

## Recommended Implementation Delegation Order

| Step | Package(s) | Rationale |
|------|-----------|-----------|
| **1** (parallel) | `@vassembly/client-web` + `@vassembly/constants` | Leaf dependencies; no blockers |
| **2** | `@vassembly/client-langchain` | Needs registry ids |
| **3** | `@vassembly/service-agent` (handlers) | Needs client + schemas |
| **4** (parallel) | `@vassembly/service-agent` (provisioning) | Needs registry entries only |

**Critical path:** 1 → 2 → 3 → (integration smoke test)

---

*Pending confirmation. Once approved, start with `@vassembly/client-web` and registry entries in parallel (Step 1), then schemas, handlers, and provisioning.*
