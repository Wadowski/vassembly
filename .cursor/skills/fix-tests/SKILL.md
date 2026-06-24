---
name: fix-tests
description: Runs monorepo quality checks, applies fixes for failures, and re-runs checks to verify. Use when fixing failing build, lint, types, unit tests, or e2e tests.
---

# Fix Tests

one attempt: **run checks → fix → verify**. Retries are handled by the parent agent, not this skill.

## Input contract

```text
failing checks: <comma-separated: build, lint, types, unit, e2e>
scope: all | packages: <pkg1,pkg2> | test: <pkg> <path>
<error output from a prior run, if available>
```

Parse `scope` into script flags:

| Value | Flags |
|-------|-------|
| `all` | none |
| `packages: @vassembly/foo,@vassembly/bar` | `--filter @vassembly/foo --filter @vassembly/bar` |
| `test: @vassembly/foo src/handlers/x/index.test.ts` | `--filter @vassembly/foo --test src/handlers/x/index.test.ts` |

E2e single-test: `test: @vassembly/web e2e/features/foo.feature`

## Scripts

Run from repo root. Paths relative to `.cursor/skills/fix-tests/scripts/`.

| Script | Purpose |
|--------|---------|
| `run-check.sh` | Run one check |
| `run-checks.sh` | Run multiple checks (comma-separated) |
| `e2e-dev-server.sh` | E2e dev server lifecycle |

### run-check.sh

```bash
.cursor/skills/fix-tests/scripts/run-check.sh <check> [--filter PKG ...] [--test PATH]
```

| Check | Maps to |
|-------|---------|
| `build` | `pnpm turbo run build` |
| `lint` | `pnpm turbo run lint` |
| `types` | `pnpm turbo run check-types` |
| `unit` | `pnpm turbo run test` |
| `e2e` | `pnpm test:e2e:web` (auto-starts dev server) |

Examples:

```bash
.cursor/skills/fix-tests/scripts/run-check.sh unit
.cursor/skills/fix-tests/scripts/run-check.sh unit --filter @vassembly/service-agent
.cursor/skills/fix-tests/scripts/run-check.sh unit \
  --filter @vassembly/service-agent \
  --test src/handlers/login/index.test.ts
.cursor/skills/fix-tests/scripts/run-checks.sh lint,unit \
  --filter @vassembly/service-agent
```

### e2e-dev-server.sh

Playwright at `apps/web/playwright.config.js` does **not** start a web server. `run-check.sh e2e` calls `ensure` automatically.

```bash
.cursor/skills/fix-tests/scripts/e2e-dev-server.sh status
.cursor/skills/fix-tests/scripts/e2e-dev-server.sh ensure
.cursor/skills/fix-tests/scripts/e2e-dev-server.sh stop
```

Call `stop` at the end of this invocation if e2e checks ran and scripts started the server.

## Workflow (single attempt)

### 1. Run initial checks

If error output is **not** provided in input, run the failing checks via `run-check.sh` / `run-checks.sh` with parsed scope flags.

If error output **is** provided, use it as initial evidence (skip re-run).

If all checks are already green, report PASS and stop.

### 2. Collect evidence

**E2e:** read all files under `apps/web/test-results/`.

**Other checks:** use error output from step 1 or input. Read referenced source files when output is truncated.

### 3. Group related issues

Cluster by root cause (same import, type pattern, lint rule, broken helper), not by error count.

### 4. Fix each group

| Symptom | Fix in |
|---------|--------|
| Stale expectation, wrong selector, outdated mock | Test code |
| Broken logic, wrong return value, missing validation | Implementation code |

Follow workspace rules. Never use `any`, `@ts-ignore`, or `eslint-disable` unless unavoidable — document why.

### 5. Verify

Re-run the failing checks via `run-check.sh` / `run-checks.sh` with the same scope flags.

If e2e ran, call `e2e-dev-server.sh stop` when done.

### 6. Report result

**PASS** — all failing checks are green:

```text
✅ Checks passing.

Verified:
- <check>: ✅
```

**FAIL** — one or more checks still failing:

```text
❌ Checks still failing.

Still failing:
- <check>:
  <concise error summary>
  Affected files: <list>

Full verification output:
<paste output from step 5>
```

Include full verification output so the parent agent can spawn the next attempt.

## Constraints

- ✅ Use scripts for every check run
- ✅ Read `apps/web/test-results/` for e2e failures
- ✅ Group before fixing
- ✅ One attempt only — do not retry
- ❌ No ad-hoc check commands
- ❌ No `any` / `@ts-ignore` / `eslint-disable` shortcuts
- ❌ No skipping checks to claim false green
