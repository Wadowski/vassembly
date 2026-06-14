# Web E2E Tests

End-to-end tests for `@vassembly/web` using Playwright and Gherkin BDD (`playwright-bdd`).

## Prerequisites

- MongoDB reachable (global setup starts docker-compose automatically if needed)
- Dependencies installed from the monorepo root: `pnpm install`

## Run tests locally

From `apps/web`:

```bash
pnpm test:e2e
```

Other modes:

```bash
pnpm test:e2e:headed
pnpm test:e2e:ui
pnpm bddgen
```

Override the web base URL:

```bash
E2E_WEB_BASE_URL=http://localhost:3000 pnpm test:e2e
```

Playwright starts `@vassembly/api` and `@vassembly/web` dev servers when they are not already running.

## Feature file organization

```
e2e/features/
├── auth/          # Authentication flows
└── mcps/          # MCP listing and detail flows
```

Group features by product area. Use tags such as `@smoke` for fast regression subsets:

```bash
pnpm bddgen && playwright test --grep @smoke
```

## Step definitions

| Location | Purpose |
|----------|---------|
| `packages/e2e/src/steps/` | Shared steps (auth, navigation, forms, assertions, API) |
| `e2e/steps/web.steps.ts` | Web-only steps (login session, MCP seeding, MCP UI) |

Reuse generic steps from `@vassembly/e2e` whenever possible. Add new web-specific steps only in `e2e/steps/`.

## Add a new scenario

1. Create or extend a `.feature` file under `e2e/features/<area>/`.
2. Write scenarios in Gherkin using existing step phrases from shared and web step files.
3. Add web-only steps to `e2e/steps/web.steps.ts` if no shared step fits.
4. Regenerate BDD tests: `pnpm bddgen`.
5. Run: `pnpm test:e2e`.

## Debugging

- **Headed browser:** `pnpm test:e2e:headed`
- **Playwright UI:** `pnpm test:e2e:ui`
- **Inspector:** `PWDEBUG=1 pnpm test:e2e`
- **Single feature:** `pnpm bddgen && playwright test e2e/features/auth/login.feature`
- **Retries / trace:** traces are captured on first retry (see `playwright.config.ts`)

Generated specs and reports are gitignored: `.features-gen/`, `.playwright/`, `playwright-report/`.
