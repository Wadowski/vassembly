# @vassembly/e2e

Shared Playwright BDD framework for end-to-end tests across Vassembly apps.

## Overview

This package provides:

- Playwright + `playwright-bdd` configuration factory
- Reusable Gherkin step definitions (auth, navigation, forms, API)
- MongoDB seed helpers for test data
- Global setup/teardown for database seeding and cleanup

## Usage

### Web app example (`apps/web/e2e`)

```typescript
import { createE2ePlaywrightConfig } from '@vassembly/e2e';

export default createE2ePlaywrightConfig({
  appName: 'web',
  featuresDir: 'e2e/features',
  stepsDirs: ['../../packages/e2e/src/steps', 'e2e/steps'],
  baseURL: 'http://localhost:3001',
});
```

Start servers separately before running tests:

```bash
pnpm dev:e2e          # MongoDB + API + Web
pnpm test:e2e:web     # Playwright tests only
```

Run tests from the app directory:

```bash
npx bddgen && npx playwright test
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | `mongodb://user:pass@localhost:27017/?directConnection=true` | MongoDB connection string |
| `MONGODB_DATABASE` | `vassembly_e2e` | Test database name |
| `JWT_SECRET` | `dev-jwt-secret` | JWT signing secret |
| `E2E_WEB_BASE_URL` | `http://localhost:3001` | Web app base URL |
| `E2E_API_BASE_URL` | `http://localhost:5001` | API base URL |
| `E2E_STOP_MONGO` | unset | Set to stop MongoDB docker-compose on teardown |

## MongoDB setup

Start MongoDB before running E2E tests:

```bash
pnpm dev:e2e:mongo
```

Or start the full E2E stack:

```bash
pnpm dev:e2e
```

Global setup seeds the database but does not start MongoDB or application servers.

## Loop & Error Detection

Automated diagnostics detect infinite update loops and request loops during test execution:

### What is Detected

- **React console errors**: "Maximum update depth exceeded", "Too many re-renders", and other infinite update errors
- **API request loops**: URLs or GraphQL operations exceeding the request threshold (default: 20 requests)

Tests are failed automatically if violations are detected, helping catch state management bugs early.

### Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `E2E_CONSOLE_ERROR_PATTERNS` | `Maximum update depth exceeded\|Too many re-renders` | Pipe-separated patterns to match in console errors |
| `E2E_REQUEST_LOOP_THRESHOLD` | `20` | Maximum allowed request count per URL or GraphQL operation before flagging as a loop |
| `E2E_ENABLE_DIAGNOSTICS` | `true` | Enable/disable all diagnostic checks (set to `false` to disable) |

### Opt-out Per Scenario

For intentional error testing or known issues, skip diagnostics for a specific scenario using the `@skip-diagnostic-checks` tag:

```gherkin
@skip-diagnostic-checks
Scenario: Intentionally trigger infinite loop to verify error boundary
  When I navigate to a component with a bug
  Then the error boundary catches the error
```

### Example

```gherkin
@smoke
Scenario: Form submission does not trigger request loop
  Given I am logged in
  When I navigate to "/agents"
  And I fill in "Name" with "Test Agent"
  And I click "Create"
  Then I see "Agent created successfully"
  # Diagnostics automatically assert:
  # - No "Maximum update depth exceeded" in console
  # - POST /api/agents called <= 20 times
```

## Public API

- `createE2ePlaywrightConfig` — Playwright config factory
- `getE2eEnvironment` — resolve URLs and credentials from env
- `bddTest` — extended Playwright test fixture
- `seedDatabase`, `seedUser`, `teardownDatabase` — data seeding helpers
- Types: `BddWorld`, `AuthContext`, `SeedContext`
- **Diagnostics**: `ConsoleErrorDetector`, `RequestLoopDetector`, `DiagnosticsReporter` — loop and error detection (auto-configured)
