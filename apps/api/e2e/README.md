# API E2E Tests

End-to-end tests for `@vassembly/api` using Playwright `APIRequestContext` and Gherkin BDD (`playwright-bdd`). No browser is involved — scenarios exercise REST commands and GraphQL queries directly.

## Prerequisites

- MongoDB reachable (global setup starts docker-compose automatically if needed)
- Dependencies installed from the monorepo root: `pnpm install`

## Run tests locally

From `apps/api`:

```bash
pnpm test:e2e
```

Other modes:

```bash
pnpm test:e2e:debug
pnpm bddgen
```

Override the API base URL:

```bash
E2E_API_BASE_URL=http://localhost:5000 pnpm test:e2e
```

Playwright starts `@vassembly/api` dev server when it is not already running.

## Feature file organization

```
e2e/features/
├── auth/          # Registration and login (REST)
└── mcps/          # MCP listing and detail (GraphQL)
```

Group features by product area. Use tags such as `@smoke` for fast regression subsets:

```bash
pnpm bddgen && playwright test --grep @smoke
```

## Step definitions

| Location | Purpose |
|----------|---------|
| `packages/e2e/src/steps/` | Shared steps (`a registered user exists…`, `the response status is {int}`) |
| `e2e/steps/api-gateway.steps.ts` | REST/GraphQL request and response assertion steps |
| `e2e/steps/auth-api.steps.ts` | API auth session and MCP seeding Given steps |

### REST vs GraphQL patterns

**REST commands** — POST/PATCH/DELETE with JSON body:

```gherkin
When I send a POST request to "/auth/login" with JSON body:
  """
  { "email": "user@example.com", "password": "secret" }
  """
Then the response status is 200
And the response contains "accessToken"
```

**GraphQL queries** — read operations via `/graphql`:

```gherkin
Given I am logged in
When I send a GraphQL query:
  """
  { mcps { id name } }
  """
Then the response status is 200
And the response contains 2 items in "data.mcps"
```

Responses are stored on `world.lastResponse` (Playwright `APIResponse`) and `world.lastResponseBody` (parsed JSON). Nested field assertions use dot paths (e.g. `data.mcp.name`).

## Add a new scenario

1. Create or extend a `.feature` file under `e2e/features/<area>/`.
2. Reuse shared steps from `@vassembly/e2e` and API steps from `e2e/steps/`.
3. Add API-only steps to `e2e/steps/api-gateway.steps.ts` or `auth-api.steps.ts` if needed.
4. Regenerate BDD tests: `pnpm bddgen`.
5. Run: `pnpm test:e2e`.

## Debugging

- **Playwright inspector:** `pnpm test:e2e:debug`
- **Single feature:** `pnpm bddgen && playwright test e2e/features/auth/login.feature`
- **Inspect responses:** set a breakpoint in a step or log `world.lastResponseBody` during `--debug`
- **Retries / trace:** traces are captured on first retry (see `playwright.config.ts`)

Generated specs and reports are gitignored: `.features-gen/`, `.playwright/`, `playwright-report/`.
