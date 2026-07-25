# MCP Catalog Expansion — Architecture

## 1. Scope

Expand the MCP discovery **catalog** (`domains/mcp/seed/mcps.json`) from 2 to 35 entries with correct, dedicated icons for every entry, and fix the two existing icons (Wikipedia currently reuses the Brave Search SVG).

**Explicitly out of scope** (already designed separately in `docs/features/mcp-servers/architecture.md`, §2–§13):

- `packages/constants/src/mcpSlugs.ts` (`MCP_SLUG` enum) expansion
- `packages/config/src/buildMcpServersConfig.ts` container/port/proxy wiring
- `domains/user-mcp-config` `CREDENTIAL_MAPPINGS` / runtime adapters
- `apps/mcp-servers` Docker images / `docker-compose.yml` services
- Real connectivity ("test connection") for the 33 new MCPs

This phase only makes the 35 MCPs **discoverable and visually correct** in the catalog UI (`apps/web/app/mcps`). Users can browse/select them; actually *running* a given MCP's tools remains gated by the existing runtime work package.

## 2. Analysis — Reuse Audit

Consulted `domains/mcp/README.md`, `domains/mcp/src/**`, `packages/constants/src/mcpSlugs.ts`, `packages/config/src/buildMcpServersConfig.ts`, and the prior `docs/features/mcp-servers/architecture.md`.

| Question | Finding |
|---|---|
| Does a domain already model "MCP catalog entry"? | Yes — `domains/mcp` (`@vassembly/domain-mcp`). No new domain needed; this is pure data + a static-asset addition to an existing package. |
| Is the seed mechanism generic enough for 35 entries? | Yes, unmodified. `readMcpSeedFile.ts` imports the JSON verbatim; `loadMcps.ts` validates each entry with `mcpSeedSchema` and inserts only slugs not already in Mongo (per-slug idempotency) — adding array entries requires zero code changes. |
| Is the seed schema (`domains/mcp/src/seed/schema.ts`) sufficient? | Yes. `slug`, `name`, `description`, `tags`, `iconPath` (`/mcps/` prefix), `transport` (required enum), `configSchema` (optional), `dockerImage` (optional), `category`/`documentationUrl`/`repositoryUrl` (optional) already cover every field the new entries need. **No schema changes required.** |
| Does the UI already render arbitrary `iconPath` values? | Yes — `McpListItem.tsx`, `McpDetailHeader.tsx`, `SpecializationMcpListItem.tsx` all do `<img src={mcp.iconPath} alt={mcp.name} />` directly from static files under `apps/web/public/mcps/`. No component changes needed; PNG works identically to SVG for `<img src>`. |
| Does `MCP_SLUG` need to grow to 35? | **No.** `SPIKE_CONTAINER_DEFAULTS` in `buildMcpServersConfig.ts` is typed `Record<MCP_SLUG, {...}>` — TypeScript requires an entry for **every** enum member. Adding 33 slugs to the enum without adding matching runtime container config would be a compile error. Catalog slugs are plain `string` per `McpSeedEntry`/`mcpSeedSchema` and are **not required to be enum members** — only the 2 MCPs with live runtime integration need an `MCP_SLUG` entry. This is the correct boundary per the existing runtime architecture doc's phased plan (§13: catalog seed ships in step 3, `MCP_SLUG`/config wiring is separate steps 1–2, done per-MCP as runtime is built). |
| Are slugs, transport, and category already decided? | Yes — `docs/features/mcp-servers/architecture.md` §5 and §9 already enumerate all 35 slugs, their transport (`native-http` / `stdio-wrapped`), category grouping, and per-MCP `configSchema` credential fields. This plan **reuses that table verbatim** as the source of truth for seed data — no new design decisions needed for those fields. |
| Icon source convention? | User-supplied: [lobehub/lobe-icons](https://github.com/lobehub/lobe-icons) static PNG CDN. Pattern confirmed: `https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/{icon-id}.png`. |

**Design pattern applied:** No new pattern needed — this is a **data-only extension** of an existing Factory/Model (`domains/mcp/src/model/factories.ts`) plus static assets. The existing seed loader already implements an idempotent bulk-insert (`loadMcps.ts`), which is the correct reuse point; introducing per-entry logic or a new loader would be over-engineering (YAGNI per `software-design-patterns.mdc` decision guide).

**Test strategy:** Unit-test-only (`tdd-unit-test-writer` not required as a separate workflow step — this is data, not new logic). Existing `domains/mcp/src/seed/loadMcps.test.ts` and `testFixtures.ts` must be extended to keep parity with the real seed file (see §7). No new E2E scenarios needed; existing `mcp-listing.feature` / `seedMcp.ts` continue to work unmodified against a larger catalog.

## 3. Icon Asset Strategy

### 3.1 Source & naming convention

- **CDN source:** `https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/{icon-id}.png`
- **Local destination:** `apps/web/public/mcps/{catalog-slug}.png`
- **Naming rule:** the local filename always matches the **catalog `slug`** (e.g. `github-mcp.png`, `context7.png`), **not** the lobehub icon id. Rationale: the catalog slug is the stable identifier already used everywhere (Mongo document, `MCP_SLUG` for the 2 wired MCPs, e2e fixtures); the lobehub icon id is an external, incidental detail (e.g. Context7's icon id is `upstash`, Chrome DevTools' is `chrome`) that would be a confusing filename. One-to-one `slug.png` file naming also means adding a 36th MCP later never risks a filename collision.
- **Format:** keep PNG (dark variant) as sourced — no SVG re-authoring. `<img src>` already renders PNG identically to SVG in the current components (no `next/image`, no SVG-specific handling found).

### 3.2 Download mechanism

A one-off shell script step (not a runtime dependency) fetches all 35 PNGs. No new package/tooling needed — plain `curl`/`wget` is sufficient and matches the "no unnecessary new logic" principle. Suggested command shape (executed once by the implementing agent, not committed as a script unless the team wants repeatable re-fetching):

```bash
curl -sSL -o apps/web/public/mcps/github-mcp.png \
  https://raw.githubusercontent.com/lobehub/lobe-icons/refs/heads/master/packages/static-png/dark/github.png
# ...repeat per row in the table in §4
```

If a lobehub icon id 404s (e.g. a niche MCP not in the library), fall back in this order: (1) `-color` suffix variant, (2) an equivalent/parent brand icon already in lobe-icons, (3) keep a neutral placeholder and flag it — do not block the rest of the catalog on one missing icon.

### 3.3 Fix for existing icons (Brave Search & Wikipedia)

Current state (`domains/mcp/seed/mcps.json`): **both** entries point at `/mcps/brave-search.svg` — Wikipedia has no dedicated icon.

Fix:
1. Download `brave-search-mcp.png` (icon id `brave`) and `wikipedia-mcp.png` (icon id `wikipedia`) using the same convention as new entries.
2. Update `mcps.json`: `brave-search-mcp.iconPath` → `/mcps/brave-search-mcp.png`; `wikipedia-mcp.iconPath` → `/mcps/wikipedia-mcp.png`.
3. Update `domains/mcp/src/seed/testFixtures.ts` (`VALID_SEED_ENTRIES`) to match the new `iconPath` values — this fixture is a parallel hand-maintained copy of `mcps.json` used by `loadMcps.test.ts` and must stay in sync (see §7).
4. **Delete** `apps/web/public/mcps/brave-search.svg` once no longer referenced (grep confirms only `mcps.json` referenced it; `testFixtures.ts` will be updated in the same change).
5. **Do NOT touch** `apps/web/public/mcps/gmail.svg`. It is a generic placeholder icon hardcoded in `apps/web/e2e/steps/utils/seedMcp.ts` (`DEFAULT_MCP_ICON_PATH`) used for ad-hoc E2E-seeded test MCPs unrelated to the real catalog — it is not the icon for the new `gmail-mcp` catalog entry. The new `gmail-mcp` entry gets its own `apps/web/public/mcps/gmail-mcp.png`.

## 4. Seed Data — All 35 Entries

Reusing slug/category/transport/credential-field decisions already made in `docs/features/mcp-servers/architecture.md` §5 & §9. Icon id/URL per the user-provided list (verified against the lobehub CDN pattern).

| Slug (catalog `slug`) | Name | Category | Transport | Icon id | Local icon file | Credential field(s) (from configSchema, §9 of mcp-servers arch) |
|---|---|---|---|---|---|---|
| `github-mcp` | GitHub MCP | `dev-tools` | `stdio-wrapped` | `github` | `github-mcp.png` | `personalAccessToken` (password) |
| `context7` | Context7 | `dev-tools` | `native-http` | `upstash` | `context7.png` | `apiKey` (password, optional) |
| `playwright-mcp` | Playwright MCP | `browser-automation` | `stdio-wrapped` | `playwright` | `playwright-mcp.png` | none |
| `puppeteer-mcp` | Puppeteer MCP | `browser-automation` | `stdio-wrapped` | `puppeteer` | `puppeteer-mcp.png` | none |
| `chrome-devtools-mcp` | Chrome DevTools MCP | `browser-automation` | `native-http` | `chrome` | `chrome-devtools-mcp.png` | none |
| `mongodb-mcp` | MongoDB MCP | `database` | `stdio-wrapped` | `mongodb` | `mongodb-mcp.png` | `connectionUri` (password) |
| `redis-mcp` | Redis MCP | `database` | `stdio-wrapped` | `redis` | `redis-mcp.png` | `connectionUrl` (password) |
| `docker-mcp` | Docker MCP | `cloud-infra` | `stdio-wrapped` | `docker` | `docker-mcp.png` | none |
| `aws-mcp` | AWS MCP | `cloud-infra` | `stdio-wrapped` | `aws` | `aws-mcp.png` | `accessKeyId`, `secretAccessKey`, `region` |
| `vercel-mcp` | Vercel MCP | `cloud-infra` | `native-http` | `vercel` | `vercel-mcp.png` | `apiToken` (password) |
| `terraform-mcp` | Terraform MCP | `cloud-infra` | `stdio-wrapped` | `terraform` | `terraform-mcp.png` | `terraformCloudToken` (password) |
| `sentry-mcp` | Sentry MCP | `security-monitoring` | `stdio-wrapped` | `sentry` | `sentry-mcp.png` | `authToken` (password) |
| `datadog-mcp` | Datadog MCP | `security-monitoring` | `native-http` | `datadog` | `datadog-mcp.png` | `apiKey`, `applicationKey` |
| `brave-search-mcp` *(existing — icon fix only)* | Brave Search MCP | `search` | `stdio-wrapped` | `brave` | `brave-search-mcp.png` | `apiKey` (password) — unchanged |
| `firecrawl-mcp` | Firecrawl MCP | `search` | `native-http` | `firecrawl` | `firecrawl-mcp.png` | `apiKey` (password) |
| `wikipedia-mcp` *(existing — icon fix only)* | Wikipedia MCP | `search` | `stdio-wrapped` | `wikipedia` | `wikipedia-mcp.png` | none — unchanged |
| `pubmed-mcp` | PubMed MCP | `search` | `stdio-wrapped` | `pubmed` | `pubmed-mcp.png` | `ncbiApiKey` (password, optional) |
| `arxiv-mcp` | ArXiv MCP | `search` | `stdio-wrapped` | `arxiv` | `arxiv-mcp.png` | none |
| `google-search-mcp` | Google Search MCP | `search` | `stdio-wrapped` | `google` | `google-search-mcp.png` | `apiKey`, `searchEngineId` |
| `notion-mcp` | Notion MCP | `knowledge` | `native-http` | `notion` | `notion-mcp.png` | `integrationToken` (password) |
| `obsidian-mcp` | Obsidian MCP | `knowledge` | `stdio-wrapped` | `obsidian` | `obsidian-mcp.png` | `apiKey` (password) |
| `granola-mcp` | Granola MCP | `knowledge` | `native-http` | `granola` | `granola-mcp.png` | `apiToken` (password) |
| `discord-mcp` | Discord MCP | `communication` | `stdio-wrapped` | `discord` | `discord-mcp.png` | `botToken` (password) |
| `gmail-mcp` | Gmail MCP | `communication` | `native-http` | `gmail` | `gmail-mcp.png` | `accessToken` (password, MVP) |
| `google-calendar-mcp` | Google Calendar MCP | `productivity` | `native-http` | `google-calendar` | `google-calendar-mcp.png` | `accessToken` (password, MVP) |
| `todoist-mcp` | Todoist MCP | `productivity` | `stdio-wrapped` | `todoist` | `todoist-mcp.png` | `apiToken` (password) |
| `linear-mcp` | Linear MCP | `productivity` | `native-http` | `linear` | `linear-mcp.png` | `apiKey` (password) |
| `stripe-mcp` | Stripe MCP | `finance` | `native-http` | `stripe` | `stripe-mcp.png` | `restrictedApiKey` (password) |
| `figma-mcp` | Figma MCP | `design` | `native-http` | `figma` | `figma-mcp.png` | `personalAccessToken` (password) |
| `google-sheets-mcp` | Google Sheets MCP | `design` | `native-http` | `google-sheets` | `google-sheets-mcp.png` | `accessToken` (password, MVP) |
| `canva-mcp` | Canva MCP | `design` | `native-http` | `canva` | `canva-mcp.png` | `accessToken` (password, MVP) |
| `home-assistant-mcp` | Home Assistant MCP | `iot-geo` | `native-http` | `home-assistant` | `home-assistant-mcp.png` | `longLivedAccessToken` (password) |
| `google-maps-mcp` | Google Maps MCP | `iot-geo` | `stdio-wrapped` | `google-maps` | `google-maps-mcp.png` | `apiKey` (password) |
| `openweather-mcp` | OpenWeather MCP | `iot-geo` | `stdio-wrapped` | `openweather` | `openweather-mcp.png` | `apiKey` (password) |
| `spotify-mcp` | Spotify MCP | `iot-geo` | `native-http` | `spotify` | `spotify-mcp.png` | `accessToken` (password, MVP) |

**`dockerImage` field:** left `undefined` (schema-optional) for the 33 new entries in this phase — no container exists yet for them, and `dockerImage` on the catalog model is unused at runtime today (`services/agent` resolves URLs via `@vassembly/config`, not the catalog field — confirmed in `buildMcpServersConfig.ts` exploration). Keep the 2 existing `dockerImage` values (`brave-search-mcp`, `wikipedia-mcp`) unchanged since they already have real containers in `apps/mcp-servers/docker-compose.yml`. Populating fake `dockerImage` values for MCPs with no container would be misleading.

**Example JSON entry** (pattern every new array item follows — `configSchema.fields` populated per the credential-field column above, using the existing `mcpConfigFieldSchema` shape from `domains/mcp/src/model/configSchema.ts`):

```json
{
  "slug": "github-mcp",
  "name": "GitHub MCP",
  "description": "Search repositories, manage issues and pull requests, and interact with GitHub via the official GitHub MCP server",
  "tags": ["dev-tools", "github", "git", "issues", "pull-requests"],
  "iconPath": "/mcps/github-mcp.png",
  "documentationUrl": "https://github.com/github/github-mcp-server",
  "repositoryUrl": "https://github.com/github/github-mcp-server",
  "category": "dev-tools",
  "transport": "stdio-wrapped",
  "configSchema": {
    "fields": [
      {
        "key": "personalAccessToken",
        "label": "Personal Access Token",
        "type": "password",
        "description": "Your GitHub personal access token",
        "required": true,
        "placeholder": "Enter your GitHub personal access token"
      }
    ]
  }
}
```

`description`, `tags`, `documentationUrl`, and `repositoryUrl` for the remaining 34 entries follow the same shape (one-line description of what the MCP does, 3–5 lowercase tags including the category, official upstream repo/docs URL where publicly known). These are content details for the implementing coder to fill in per MCP — no architectural decision needed since the shape is fully specified by `mcpSeedSchema`.

## 5. Phasing Decision

**Recommendation: add all 35 entries to `mcps.json` in a single change, not phased.**

Rationale:
- The seed loader (`loadMcps.ts`) is already generic and idempotent — there is no incremental complexity cost to adding 33 rows vs. 1. A phased *catalog* rollout would only add coordination overhead (multiple PRs touching the same JSON file) without a corresponding technical reason to split it.
- Catalog visibility is decoupled from runtime readiness by design (§2 — `MCP_SLUG`/config/Docker are separate, already-phased work packages in `docs/features/mcp-servers/architecture.md` §13). Users can see and read about an MCP in the catalog before it's runnable; the UI already renders `configurationStatus`/tags without needing a live connection.
- Icon downloading is the only "bulk" activity (35 `curl` calls) and is naturally a single scripted step, not something that benefits from splitting across multiple change sets.

**What stays phased (unchanged, per the existing runtime architecture doc):** `MCP_SLUG` enum growth, `buildMcpServersConfig` container entries, `CREDENTIAL_MAPPINGS`, and `apps/mcp-servers` Docker images continue to roll out **per-MCP as each runtime integration is built** — this catalog change does not accelerate or block that work.

## 6. Architecture & Package Placement

| Layer | Package | Change |
|---|---|---|
| Static assets | `apps/web` (Next.js public folder) | Add 35 PNGs, remove 1 stale SVG |
| Domain seed data | `domains/mcp` (`@vassembly/domain-mcp`) | Extend `seed/mcps.json`; update `src/seed/testFixtures.ts` to stay in sync |
| Domain seed schema | `domains/mcp/src/seed/schema.ts` | **No change** — already generic |
| Domain model | `domains/mcp/src/model/*` | **No change** — `McpModel`/`configSchema` already support all needed fields |
| Constants | `packages/constants/src/mcpSlugs.ts` | **No change** in this phase (see §2) |
| Runtime config | `packages/config/src/buildMcpServersConfig.ts` | **No change** in this phase |
| Runtime adapters | `domains/user-mcp-config` | **No change** in this phase |

Data flow is unchanged: `apps/api` bootstrap (`apps/api/src/routes/index.ts`) calls `mcpDomain.seedMcps()` once at startup → `loadMcps()` validates the (now 35-entry) JSON → inserts any slugs missing from the `mcps` Mongo collection → `queries.getList`/`getById` (already existing) serve the catalog to `apps/web` via GraphQL (per `api-calling-conventions.mdc`, catalog reads already correctly use GraphQL, no REST changes needed since this is read-only data).

No new packages, domains, or services are needed — this fully fits inside the existing `domains/mcp` + `apps/web/public` boundary.

## 7. Test / E2E Updates

| File | Change needed | Why |
|---|---|---|
| `domains/mcp/src/seed/testFixtures.ts` | Update `VALID_SEED_ENTRIES` to mirror the real `mcps.json` exactly (all 35 entries, corrected icon paths) | `loadMcps.test.ts` asserts against this fixture; if it silently diverges from the real seed file, the test suite stops catching real seed-file regressions. Given it's a hand-maintained parallel copy, this is the one place a design choice matters: **keep the duplication** (matches existing pattern) rather than importing `mcps.json` directly into the test, since `loadMcps.test.ts` intentionally tests malformed/valid *fixture* variants independently of the production file's exact contents — but the "valid" fixture should still stay representative in size/shape. |
| `domains/mcp/src/seed/loadMcps.test.ts` | No logic changes; re-run to confirm 35-entry validation still passes and `insertedCount`/`skippedCount` assertions (if any assert exact counts against `VALID_SEED_ENTRIES.length`) are updated if hardcoded to `2` | Idempotency/validation logic is unaffected by entry count, but any hardcoded `length === 2` assertions must track the fixture change |
| `domains/mcp/src/queries/getList/index.test.ts` | Review only — confirm it doesn't hardcode "exactly 2 MCPs in catalog" as an invariant; if it does, generalize or seed its own isolated fixture | Avoid false failures from a larger real catalog |
| `services/mcp/test/fixtures/mockCatalog.ts` | No change required (isolated mock, not tied to real seed count) — verify during implementation | Confirm no accidental coupling |
| `apps/web/e2e/features/mcps/*.feature`, `apps/web/e2e/steps/**` | No change required | `seedMcpCatalog()` calls the same `seedMcps()`; scenarios that reference `brave-search-mcp`/`wikipedia-mcp` by slug (`seedUserMcpConfiguration.ts`) keep working since those two slugs are unchanged (only their icon path changes, which E2E doesn't assert on) |
| `apps/web/app/mcps/__tests__/fixtures/mcpListFixtures.ts` | No change required | Uses independent `/icons/*.svg` test fixtures, unrelated to real `/mcps/` catalog assets |

No new unit or E2E test *scenarios* are required — this is a data-volume change to an already-tested read path, not new behavior. The only required test edit is keeping `testFixtures.ts` synchronized (§7 table).

## 8. File-by-File Change List

### New files (35 icon assets)

```
apps/web/public/mcps/github-mcp.png
apps/web/public/mcps/context7.png
apps/web/public/mcps/playwright-mcp.png
apps/web/public/mcps/puppeteer-mcp.png
apps/web/public/mcps/chrome-devtools-mcp.png
apps/web/public/mcps/mongodb-mcp.png
apps/web/public/mcps/redis-mcp.png
apps/web/public/mcps/docker-mcp.png
apps/web/public/mcps/aws-mcp.png
apps/web/public/mcps/vercel-mcp.png
apps/web/public/mcps/terraform-mcp.png
apps/web/public/mcps/sentry-mcp.png
apps/web/public/mcps/datadog-mcp.png
apps/web/public/mcps/brave-search-mcp.png   (fix — replaces brave-search.svg reuse)
apps/web/public/mcps/firecrawl-mcp.png
apps/web/public/mcps/wikipedia-mcp.png      (fix — Wikipedia's own icon)
apps/web/public/mcps/pubmed-mcp.png
apps/web/public/mcps/arxiv-mcp.png
apps/web/public/mcps/google-search-mcp.png
apps/web/public/mcps/notion-mcp.png
apps/web/public/mcps/obsidian-mcp.png
apps/web/public/mcps/granola-mcp.png
apps/web/public/mcps/discord-mcp.png
apps/web/public/mcps/gmail-mcp.png
apps/web/public/mcps/google-calendar-mcp.png
apps/web/public/mcps/todoist-mcp.png
apps/web/public/mcps/linear-mcp.png
apps/web/public/mcps/stripe-mcp.png
apps/web/public/mcps/figma-mcp.png
apps/web/public/mcps/google-sheets-mcp.png
apps/web/public/mcps/canva-mcp.png
apps/web/public/mcps/home-assistant-mcp.png
apps/web/public/mcps/google-maps-mcp.png
apps/web/public/mcps/openweather-mcp.png
apps/web/public/mcps/spotify-mcp.png
```

### Deleted files

```
apps/web/public/mcps/brave-search.svg   (superseded by brave-search-mcp.png; no longer referenced)
```

### Kept as-is (do not touch)

```
apps/web/public/mcps/gmail.svg   (generic E2E placeholder, unrelated to gmail-mcp catalog entry — see §3.3)
```

### Modified files

```
domains/mcp/seed/mcps.json                  — 2 icon-path fixes + 33 new entries (35 total)
domains/mcp/src/seed/testFixtures.ts        — mirror mcps.json (icon paths + 33 new VALID_SEED_ENTRIES rows)
```

### Files reviewed, no change required

```
domains/mcp/src/seed/schema.ts
domains/mcp/src/seed/loadMcps.ts
domains/mcp/src/seed/readMcpSeedFile.ts
domains/mcp/src/model/*.ts
packages/constants/src/mcpSlugs.ts
packages/config/src/buildMcpServersConfig.ts
domains/user-mcp-config/src/commands/resolveMcpServerConfigs/adapters/credentialMappings.ts
apps/web/app/mcps/_components/McpListItem/McpListItem.tsx
apps/web/app/mcps/[id]/_components/McpDetailHeader.tsx
apps/web/app/specialization/[id]/_components/SpecializationMcpsPanel/SpecializationMcpListItem/SpecializationMcpListItem.tsx
apps/web/e2e/steps/utils/seedMcp.ts
apps/api/src/routes/index.ts
```

## 9. Todo Plan

1. **`apps/web` (public assets)** — Type: static assets, no code
   - Changes needed: Download 35 lobehub PNGs per §3–§4 table, save under `apps/web/public/mcps/{slug}.png`; delete stale `brave-search.svg`
   - Files to modify/create: see §8 "New files" and "Deleted files" lists
   - Suggested subagent workflow: `coder → Done` (no tests apply to binary assets; a quick manual/script check that all 35 files exist and are non-empty is sufficient)
   - Dependencies: None — can run in parallel with Todo 2

2. **`domains/mcp`** — Type: existing domain, data-only extension
   - Changes needed: Fix `brave-search-mcp`/`wikipedia-mcp` `iconPath` values; append 33 new entries to `domains/mcp/seed/mcps.json` per §4 table (using each MCP's real docs/repo URL where publicly known); mirror all changes into `domains/mcp/src/seed/testFixtures.ts`
   - Files to modify/create: `domains/mcp/seed/mcps.json`, `domains/mcp/src/seed/testFixtures.ts`
   - Suggested subagent workflow: `coder → code-reviewer (1 pass, verify against mcpSeedSchema + §4 table) → Done` (no `tdd-unit-test-writer` needed — no new logic; existing `loadMcps.test.ts` continues to validate correctness against the updated fixture)
   - Dependencies: Should land in the same PR/commit as Todo 1 (icon filenames referenced by `iconPath` must exist), but the JSON/fixture edits themselves have no code dependency on Todo 1's completion — can be authored in parallel and merged together

3. **Verification pass (no dedicated package)** — Type: review/QA
   - Changes needed: Run `domains/mcp` unit tests (`loadMcps.test.ts`, `getList/index.test.ts`) to confirm the expanded seed still validates and no test hardcodes a catalog size of 2; spot-check `apps/web/app/mcps` list/detail pages render all 35 icons correctly against a locally seeded catalog
   - Files to modify/create: none expected (only if a hardcoded count assertion is found, generalize it in-place)
   - Suggested subagent workflow: `tester → Done`
   - Dependencies: Todos 1 and 2 complete
