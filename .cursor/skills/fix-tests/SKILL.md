---
name: fix-tests
description: Runs monorepo quality checks, applies fixes for failures, and re-runs the full check suite to verify. Use when fixing failing build, lint, types, unit tests, or e2e tests.
---

# Fix tests

The goal is to make sure all validation checks pass. 
It runs initial checks to understand what is broken, implement fixes and run validation again. 
Do not repeat any flow, strictly follow what described below. 
If after final validation something is still failing, do not try to fix it, respond with check summary.

## Prerequisites

Use proper node version:

```bash
nvm use
```

Install dependencies:

```bash
pnpm i
```

Run dev server for e2e tests in the **background** (long-running server — do not block on it):

```bash
pnpm run dev:e2e
```

Use Shell with `block_until_ms: 0` so the command returns immediately and the server keeps running. Wait until api and web endpoints respond before running e2e checks.

## Initial check run

Run lint check:

```bash
pnpm run lint
```

Run types check:

```bash
pnpm run check-types
```

Run unit tests check:

```bash
pnpm run test
```

Run e2e tests check (long-running — expect **~10 minutes**):

```bash
pnpm run test:e2e
```

**E2e run rules — follow strictly:**

- Set Shell `block_until_ms` to at least **660000** (11 min) so the command can finish without premature timeout.
- While this command is still running, **do nothing else** — no diagnosis, no fixes, no re-runs, no alternate commands. Wait until it completes.
- If Shell returns before tests finish, use `Await` on the same task with `block_until_ms: 660000` — do **not** assume failure or start fixing.
- Determine pass/fail from the command **exit code only**. Do **not** read or load the e2e terminal file into context — Playwright output is huge and mostly noise.
- After the run completes, use `apps/web/test-results/` for failure details (see **Gather check results**).

Stop the e2e dev server after the initial check run completes — kill the background shell from the prerequisites step before diagnosis and fixes.

## Gather check results

Record pass/fail for each check from the initial run: `lint`, `check-types`, `test`, `test:e2e`.

**Lint, types, unit:** use terminal output from the initial run. Note failing package, file path, rule or assertion, and error message. Read referenced source files when output is truncated.

**E2e:** do **not** read the e2e terminal output — it is too large for context and not needed. Do **not** use terminal output for failure details; all error results are stored in the test-results folder. For each failed test, open its folder under `apps/web/test-results/` and read:

| File | Purpose |
|------|---------|
| `error-context.md` | Assertion message, step, URL, page snapshot |

Read every failed test's `error-context.md` before moving to diagnosis.

If all checks passed in the initial run, skip diagnosis and fixes — go straight to **Validate fixes**.

## Errors diagnosis

Group failures by root cause (same import, type pattern, lint rule, broken helper, selector), not by error count.

**E2e:** diagnose only from `apps/web/test-results/` — never from Playwright terminal logs.

**Other checks:** trace each error to the offending file and line from the gathered output.

Identify whether the fix belongs in test code or implementation before editing.

## Apply fixes

Fix each group once. Prefer the smallest correct change.

| Symptom | Fix in |
|---------|--------|
| Stale expectation, wrong selector, outdated mock | Test code |
| Broken logic, wrong return value, missing validation | Implementation code |

Follow workspace rules. Never use `any`, `@ts-ignore`, or `eslint-disable` unless unavoidable — document why.

Do not re-run checks here. Validation happens in the next section.

## Validate fixes

Run lint, types, and unit checks **first**. Do **not** start the e2e dev server or run e2e until all three pass.

Run lint check:

```bash
pnpm run lint
```

Run types check:

```bash
pnpm run check-types
```

Run unit tests check:

```bash
pnpm run test
```

**If lint, types, or unit tests fail:** gather results from this run, return to **Errors diagnosis** and **Apply fixes**, then run this section again from the top. Repeat until lint, types, and unit all pass — only then proceed to e2e below.

**If lint, types, and unit all pass:** continue with e2e prerequisites and e2e tests.

### e2e tests prerequisites

Run only after lint, types, and unit checks are green.

Run dev server for e2e tests in the **background** (long-running server — do not block on it):

```bash
pnpm run dev:e2e
```

Use Shell with `block_until_ms: 0` so the command returns immediately and the server keeps running. Wait until api and web endpoints respond before running e2e checks.

### e2e tests

Run e2e tests check (long-running — expect **~10 minutes**):

```bash
pnpm run test:e2e
```

Apply the same **E2e run rules** from the initial check run: long `block_until_ms`, wait for completion before acting, no terminal output in context, exit code for pass/fail, `test-results/` for failures.

## Cleanup

Stop the e2e dev server after the validate-fixes run completes — kill the background shell from the **Validate fixes prerequisites** step.

Remove all artifacts created during this run. Make sure all dev servers are closed.

## Response

If after final validation something is still failing, do not try to fix it again — respond with the check summary below.

**PASS** — all checks from validate fixes are green:

```text
✅ All checks passing.

Verified:
- lint: ✅
- types: ✅
- unit: ✅
- e2e: ✅
```

**FAIL** — one or more checks still failing:

```text
❌ Checks still failing.

Still failing:
- <check>:
  <concise error summary>
  Affected files: <list>

Full verification output:
<paste output from validate fixes — for e2e, summarize from apps/web/test-results/ error-context.md files, not terminal logs>
```

For e2e failures, paste summaries from `error-context.md` files rather than raw Playwright terminal output.

