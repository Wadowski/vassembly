# E2E Testing

This project uses Playwright BDD (Gherkin) for end-to-end testing.

## Quick Start

### Local Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start E2E infrastructure** in one terminal (MongoDB + API + Web with `.env.e2e`):
   ```bash
   pnpm dev:e2e
   ```

   Or start components separately:
   ```bash
   pnpm dev:e2e:mongo    # @vassembly/client-mongodb dev
   pnpm dev:e2e:apps     # @vassembly/api and @vassembly/web dev
   ```

3. **Run tests** in another terminal:
   ```bash
   pnpm test:e2e:web
   ```

Playwright only runs tests — it does not start MongoDB or application servers.

### Environment

E2E settings live in `.env.e2e` (ports, MongoDB, JWT). Root scripts load it via `dotenv -e .env -e .env.e2e`.

Default local ports: Web `3001`, API `5001`, Docs `3002`.

### Running with Options

```bash
# UI mode (interactive Playwright UI)
cd apps/web && pnpm test:e2e:ui

# Headed (browser visible)
cd apps/web && pnpm test:e2e:headed

# Single feature
cd apps/web && pnpm bddgen && playwright test features/auth/login.feature

# By tag
cd apps/web && pnpm bddgen && playwright test --grep @smoke

# Debug mode with inspector
cd apps/web && pnpm bddgen && PWDEBUG=1 playwright test
```

## Writing Tests

### Feature Files

Feature files use Gherkin syntax and live in `apps/{app}/e2e/features/`.

```gherkin
@tag
Feature: Feature Name

  Background:
    Given some setup

  Scenario: Clear scenario title
    When I do something
    Then I see a result
```

### Step Definitions

Steps are defined in:
- `packages/e2e/src/steps/` — Shared generic steps (auth, navigation, forms, assertions)
- `apps/{app}/e2e/steps/` — App-specific steps (web UI interactions, API endpoints)

To add a step:

```typescript
import { createBdd } from 'playwright-bdd';
import { bddTest } from '@vassembly/e2e';

const { When, Then } = createBdd(bddTest);

When('I do something', async ({ page }) => {
  // Implementation
});
```

### Regenerating Specs

After editing `.feature` files, regenerate Playwright specs:

```bash
cd apps/{app}
pnpm bddgen
```

Generated specs go to `.features-gen/` (git-ignored).

## Debugging

### Playwright Inspector

```bash
cd apps/web
pnpm bddgen && PWDEBUG=1 playwright test
```

### View Test Report

```bash
cd apps/web
pnpm bddgen && playwright test
playwright show-report
```

### Inspect Variables

Add `console.log` in steps or use Playwright's `page.pause()` to stop mid-test.

## CI/CD

E2E tests run on every PR via GitHub Actions (`.github/workflows/ci.yml`, `e2e-web` job):

1. MongoDB runs as a GitHub Actions service container
2. API and Web are started with `pnpm dev:e2e:apps` (same script as local, `.env.e2e` applied)
3. Playwright runs tests only (`pnpm test:e2e:web`)

Artifacts (screenshots, videos, traces) are uploaded on failure.
