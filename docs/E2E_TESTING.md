# E2E Testing

This project uses Playwright BDD (Gherkin) for end-to-end testing.

## Quick Start

### Local Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start MongoDB:**
   ```bash
   pnpm --filter @vassembly/client-mongodb dev
   ```
   Or rely on global setup (auto-starts in CI).

3. **Set environment variables:**
   ```bash
   cp .env.e2e .env.local
   # Update .env.local with your values if needed
   # Or start dev servers with: pnpm dev:e2e
   ```

4. **Run tests:**
   ```bash
   pnpm test:e2e                 # Run all E2E tests
   pnpm test:e2e:web             # Run web E2E only
   pnpm test:e2e:api             # Run API E2E only
   ```

### Running with Options

```bash
# UI mode (interactive Playwright UI)
cd apps/web && pnpm test:e2e:ui

# Headed (browser visible)
cd apps/api && pnpm bddgen && playwright test --headed

# Single feature
cd apps/web && pnpm bddgen && playwright test features/auth/login.feature

# By tag
pnpm bddgen && playwright test --grep @smoke

# Debug mode with inspector
cd apps/api && pnpm test:e2e:debug
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

E2E tests run on every PR via GitHub Actions (`.github/workflows/ci.yml`, `e2e-web` job). Tests must pass before merge.

Artifacts (screenshots, videos, traces) are uploaded on failure.
