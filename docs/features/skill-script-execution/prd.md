# Product Requirements Document: Skill Script Execution (Vassembly)

**Document status:** Approved for architecture handoff  
**Last updated:** 2026-07-01  
**Related PRDs:** [Skill](../skill/prd.md), [Task Skill Planning](../task-skill-planning/prd.md), [Agent Internal Tools](../agent-internal-tools/prd.md), [Async LLM Task Execution](../async-llm-task-execution/prd.md)  
**Feature slug:** `skill-script-execution`

---

## 1. Executive Summary

### 1.1 Problem

Skills persist **executable scripts** (Python, Node.js, Bash, Terminal) alongside Markdown rules, but the platform has **no runtime to execute them**. The `resolve-skill` internal tool returns `{ skillName, rule }` only — no script content, no execution path. Admin UI can view script source via REST, but system agents cannot run scripts when a skill rule instructs them to do so.

This gap blocks:

- **Deterministic task execution** — Task Skill Planning authors scripts for repeatable logic, but execution depends on a sandbox runtime that does not exist
- **Agent Skills standard alignment** — agentskills.io bundles `scripts/` for a reason; rules reference scripts the agent should run
- **Safe automation** — without a governed execution path, models may attempt unsafe workarounds (inline code, host shell) or skip deterministic steps entirely

### 1.2 Solution

Introduce a **sandboxed skill script execution runtime** exposed to system agents via a new internal tool **`run-skill-script`** (`run_skill_script` LLM name). Script execution is triggered in **two ways**:

1. **LLM-initiated** — the agent calls `run_skill_script` with `skillName`, `filename`, and optional structured `input`
2. **Rule-initiated (auto-run)** — when a resolved skill rule contains an explicit run directive (e.g. `run_skill_script scripts/validate.py`, `run skill validate`, `run scripts/validate.py`), the platform auto-dispatches execution without requiring a separate tool call

In both cases:

1. The platform validates authorization scope (specialization + enabled skill), fetches script content from existing storage, and submits a job to the **sandbox backend** (`local` on developer machine, `cloud` Firecracker worker pool in production)
2. The script runs in an **isolated process** within a **shared task workspace** (no host filesystem, **strictly no network** — use MCP or web-search tools for network access)
3. The agent turn **blocks until the script finishes** — there is **no wall-clock timeout**
4. The tool returns structured `{ exitCode, stdout, stderr, durationMs, truncated }`; the **LLM decides** how to handle non-zero exit codes (errors may be expected)

The execution service is **stateless and horizontally scalable** in cloud, designed for **Firecracker microVMs** with warm pools and script content caching. **Local development is first-class:** the same sandbox contract runs **entirely on the developer machine** — no cloud credentials, no remote worker pool, no AWS dependency — as part of the standard `pnpm run dev` stack.

### 1.3 Success Metrics

| Metric | Target (90 days post launch) | Measurement |
|--------|------------------------------|-------------|
| Script execution availability | ≥ 99.5% successful dispatch (excluding script bugs) | `skill.script.run.completed` / total attempts |
| Cold-start latency | p95 dispatch-to-start < 3 s | Worker metrics |
| Warm execution latency | p95 end-to-end < 5 s for scripts ≤ 512 KB | Tool handler + worker metrics |
| Security incidents | 0 sandbox escapes or cross-tenant data leaks | Security audit + incident log |
| Agent adoption | ≥ 40% of tasks with `skillIdsUsed` invoke at least one script when skill rule references scripts | Task logs |
| Deterministic replay | Same script + same input + same workspace state produces identical stdout on repeat runs (excluding timestamps) | QA spot-check |
| Local dev readiness | 100% of Phase 1 acceptance scenarios pass with `skills.execution.backend=local` and no cloud credentials | CI local-backend job |

### 1.4 Scope — Phase 1 Only

**This release delivers Phase 1 only.** Future enhancements (task progress integration, file artifacts, audit UI) are explicitly deferred.

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **Phase 1 — Core runtime (this release)** | Cloud Firecracker worker pool **and** fully local sandbox (no cloud), shared workspace model, `run-skill-script` internal tool, rule auto-run parser, `terminal` script language, auto-assignment to workers, observability | **In scope** |
| **Phase 2 — Performance hardening** | Warm pool tuning, script cache optimization | Deferred |
| **Phase 3 — Task integration** | Progress timeline events, `scriptRuns[]` on task document | Deferred |
| **Phase 4 — Advanced I/O** | Writable file artifacts beyond stdout, read-only file mounts | Deferred |

---

## 2. User Personas

| Persona | Description | Primary interaction |
|---------|-------------|---------------------|
| **System Agent (AI)** | Specialization workers, task workers, skill-resolver agents | Calls `run_skill_script` or receives auto-run results when rule instructs script use |
| **Platform Admin** | Audits skills, scripts, and execution logs | Indirect — views skill scripts on admin UI; future: execution audit dashboard |
| **End User** | Submits tasks; expects deterministic outcomes when skills include scripts | No direct script invocation; benefits via task execution quality |
| **Platform Engineering** | Operates cloud infrastructure for Firecracker workers | Deploys, scales, monitors execution worker pool |
| **Developer** | Runs the monorepo locally for feature work and debugging | Uses local sandbox via standard dev stack; no cloud setup required for script execution |

---

## 3. User Stories

Stories use **Gherkin** acceptance criteria. IDs follow `SSE-N` (Skill Script Execution).

### System agent stories

**SSE-1 — Run a skill script via internal tool**

```gherkin
As a system agent with run-skill-script assigned
I want to execute a bundled script for a resolved skill
So that deterministic logic runs without free-form model reasoning

Scenario: Successful Python script execution
  Given skill "contract-review" for specialization "spec_legal" has script "scripts/validate.py"
  And the skill is enabled and not archived
  And the calling agent's specializationId is "spec_legal"
  When the agent calls run_skill_script with skillName "contract-review" and filename "scripts/validate.py"
  Then the platform fetches script content from storage
  And the script runs in an isolated process within the task workspace
  And the agent turn blocks until the script completes
  And the tool returns exitCode, stdout, stderr, and durationMs
  And exitCode is 0 when the script succeeds

Scenario: Script not found
  Given skill "contract-review" has no script "scripts/missing.py"
  When run_skill_script is called with filename "scripts/missing.py"
  Then the tool returns a clear not-found error
  And no sandbox job is created

Scenario: Disabled or archived skill rejected
  Given skill "contract-review" is disabled or archived
  When run_skill_script is called for that skill
  Then the tool returns a validation or not-found error
  And no sandbox job is created
```

**SSE-2 — Structured input and output**

```gherkin
As a system agent
I want to pass structured JSON input to a script and receive captured stdout
So that scripts can process task-specific data deterministically

Scenario: JSON input passed to script including PII
  Given a Node.js script expects JSON input
  When run_skill_script is called with input { "contractId": "12345", "documentText": "..." }
  Then the sandbox receives the input according to the I/O contract
  And input is encrypted in transit to the microVM
  And stdout is returned to the agent
  And stderr is returned separately when non-empty

Scenario: Output truncation for oversized stdout
  Given a script produces stdout larger than the configured max (default 256 KB)
  When run_skill_script completes
  Then stdout is truncated with truncated: true in the response
  And a warning is logged
  And the agent receives the leading portion of output

Scenario: No file artifact output in Phase 1
  Given a script writes files to the workspace
  When run_skill_script completes
  Then only stdout is returned to the agent via the tool response
  And workspace files are not uploaded or exposed in Phase 1
```

**SSE-3 — Authorization scoped to specialization**

```gherkin
As the platform
I want script execution limited to skills in the caller's authorized specialization scope
So that agents cannot run scripts from other domains

Scenario: Cross-specialization skill rejected
  Given skill "deploy-service" belongs to specialization "spec_engineering"
  And the calling agent's specializationId is "spec_legal"
  When run_skill_script is called for skillName "deploy-service"
  Then the tool returns an authorization error
  And no sandbox job is created

Scenario: Task context allows multiple specializations
  Given InternalToolContext.specializationIds is ["spec_legal", "spec_finance"]
  And skill "tax-calc" belongs to "spec_finance"
  When run_skill_script is called from a task worker agent
  Then execution is permitted when skill.specializationId is in specializationIds

Scenario: specializationId resolution matches resolve-skill
  Given the caller agent has no specializationId
  And context provides specializationIds from the task
  When run_skill_script is called with skillName only
  Then specializationId is resolved using the same precedence as resolve_skill
```

**SSE-4 — Resource limits (no wall-clock timeout)**

```gherkin
As the platform
I want script execution bounded by resource limits but not by wall-clock timeout
So that long-running deterministic scripts can complete while runaway memory use is prevented

Scenario: Script runs without wall-clock timeout
  Given a script requires 10 minutes to complete
  When run_skill_script is called
  Then the agent turn blocks until the script finishes
  And no wall-clock timeout terminates the process
  And durationMs reflects actual elapsed time

Scenario: Script exceeds memory limit
  Given default memory limit is 256 MB
  When a script exceeds the memory cap
  Then the sandbox kills the process
  And the tool returns a resource-limit error with partial stderr if available
  And the LLM decides whether to retry or continue the task
```

**SSE-8 — Rule-initiated auto-run**

```gherkin
As the platform
I want scripts auto-executed when a skill rule contains explicit run directives
So that agents follow skill procedures without always issuing a separate tool call

Scenario: Auto-run on run_skill_script directive in rule
  Given the agent has resolved skill "contract-review"
  And the rule contains "run_skill_script scripts/validate.py"
  When the platform processes the rule during agent execution
  Then the platform auto-dispatches script execution
  And the agent turn blocks until completion
  And stdout/stderr are injected into agent context per architecture

Scenario: Auto-run on natural language run directive
  Given the rule contains "run skill validate" or "run scripts/validate.py"
  When the platform parses the directive against the skill's script catalog
  Then the matching script is executed automatically
  And ambiguous directives require LLM to call run_skill_script explicitly

Scenario: LLM may still call run_skill_script directly
  Given the agent decides to run a script not referenced in the rule
  When the agent calls run_skill_script with skillName and filename
  Then execution proceeds via the tool path
  And both trigger paths use the same sandbox and workspace
```

**SSE-9 — Terminal script language**

```gherkin
As a skill author
I want a terminal script type that runs arbitrary shell commands
So that skills can execute flexible command-line operations within the sandbox

Scenario: Terminal script executes command body
  Given skill "data-prep" has script "scripts/transform.terminal" with language "terminal"
  And script content is "cat input.json | jq '.items[]' | wc -l"
  When run_skill_script is called for that script
  Then the command runs in a shell within the task workspace
  And stdout is captured and returned
  And the script runs with the same sandbox constraints as bash scripts

Scenario: Terminal script in skill domain enum
  Given SKILL_SCRIPT_LANGUAGES includes "terminal"
  When create_skill is called with language "terminal"
  Then the script is persisted with language "terminal"
  And the admin UI displays terminal scripts with shell highlighting
```

**SSE-10 — Shared workspace across script runs**

```gherkin
As a system agent
I want multiple script runs within the same task to share a workspace
So that later scripts can use files produced by earlier scripts

Scenario: Second script reads file from first script
  Given a task workspace exists for taskId "task_01"
  When run_skill_script runs "scripts/step1.py" which writes "output.json" to the workspace
  And run_skill_script then runs "scripts/step2.py"
  Then step2 can read "output.json" from the shared workspace
  And each script runs in an isolated process
  And workspace state is not shared across different tasks or tenants

Scenario: Workspace cleaned after task invocation completes
  Given all agent turns for a task invocation have completed
  Then the task workspace is destroyed
  And no workspace files persist beyond the invocation lifecycle
```

### Integration stories

**SSE-5 — Workflow after resolve-skill**

```gherkin
As a specialization worker agent
I want to resolve a skill rule then run its scripts when instructed
So that I follow the two-tier skill loading pattern

Scenario: Typical skill usage flow
  Given the agent has resolve-skill and run-skill-script assigned
  When the agent needs skill "contract-review"
  Then it calls resolve_skill to load the full rule
  And the rule instructs running "scripts/validate.py" with specific input
  And the platform auto-runs the script or the agent calls run_skill_script
  And uses stdout/stderr to continue the task

Scenario: run-skill-script auto-assigned to workers
  Given a specialization worker or task worker system agent exists
  Then run-skill-script is assigned by default in seed
  And the agent can invoke script execution without manual admin assignment
```

**SSE-11 — Local sandbox without cloud**

```gherkin
As a developer
I want skill script execution to work fully on my local machine
So that I can develop and test skills without cloud infrastructure or credentials

Scenario: Local dev runs sandbox on the developer machine
  Given the monorepo is started with the standard local dev command
  And skills.execution.backend is "local"
  When an agent calls run_skill_script for a skill with a bundled script
  Then the script runs in a local sandbox process on the developer machine
  And no AWS, Firecracker cloud, or remote worker endpoint is required
  And stdout/stderr are returned with the same tool response shape as cloud

Scenario: Local sandbox matches cloud execution contract
  Given the same skill script and input are used locally and in cloud
  When run_skill_script completes in both environments
  Then both return exitCode, stdout, stderr, and durationMs
  And both enforce no network egress and shared workspace semantics
  And language support is identical (python, nodejs, bash, terminal)

Scenario: Local dev documents prerequisites
  Given a developer clones the repository
  When they follow the local setup guide for skill script execution
  Then they can run scripts after installing documented local prerequisites only
  And no cloud API keys are required for sandbox execution
```

**SSE-6 — Scripts not run during planning**

```gherkin
As the platform
I want script execution excluded from the planning phase
So that planning remains fast and execution happens during worker turns only

Scenario: Scripts not run during planning
  Given Task Planner is composing a plan
  When Skill Planner creates scripts via create_skill
  Then no script execution occurs during planning
  And scripts are stored for later execution only
```

### Admin and audit stories

**SSE-7 — Execution observability**

```gherkin
As a platform operator
I want structured logs for every script execution attempt
So that I can audit, debug, and monitor sandbox health

Scenario: Successful run logged
  When run_skill_script completes successfully
  Then a structured log event skill.script.run.completed is emitted
  And the log includes taskId, skillId, filename, language, durationMs, exitCode
  And script source code is NOT logged
  And PII in input is NOT logged at info level

Scenario: Failed run logged
  When sandbox dispatch or execution fails
  Then skill.script.run.failed is logged with error code
  And no sensitive input values are logged at info level

Scenario: Non-zero exit does not auto-fail task
  Given a script returns exitCode 1
  When the tool returns the result to the agent
  Then the task does not automatically fail
  And the LLM decides how to proceed (retry, continue, or fail)
```

---

## 4. Functional Requirements

### 4.1 Internal tool — `run-skill-script`

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-IT-1 | Register `run-skill-script` in `INTERNAL_TOOLS` with `accessScope: SYSTEM_ONLY`. | Present in registry; appears in system agent internal tools picker. |
| FR-IT-2 | LLM tool name: `run_skill_script`. | Schema bound in `buildInternalTools`. |
| FR-IT-3 | Required params: `skillName` (string), `filename` (string). | Validation error if missing or empty. |
| FR-IT-4 | Optional params: `specializationId` (string), `input` (JSON object, default `{}`), `env` (object of string→string, restricted — see §4.5). | Omitted `specializationId` uses same resolution chain as `resolve-skill`. |
| FR-IT-5 | Tool handler validates skill is active, enabled, and in authorized specialization scope before dispatch. | Cross-scope and disabled/archived skills rejected. |
| FR-IT-6 | Tool handler fetches script via `skillDomain.queries.getScriptContent` (or equivalent active-skill query). | Uses existing storage abstraction (S3/local). |
| FR-IT-7 | Tool returns JSON string: `{ skillName, filename, exitCode, stdout, stderr, durationMs, truncated }`. | Non-zero exitCode returns output without throwing; task does not auto-fail. |
| FR-IT-8 | Dispatch failures (sandbox unavailable, validation) throw descriptive errors from `@vassembly/errors`. | Agent receives tool error message. |
| FR-IT-9 | **Auto-assigned** to all specialization worker agents and task worker agents in seed. | Seed updated; no manual admin assignment required for workers. |
| FR-IT-10 | Agent turn **blocks synchronously** until script completes — **no wall-clock timeout**. | Tool handler awaits worker completion indefinitely (subject to infrastructure health). |
| FR-IT-11 | **Rule auto-run:** platform parses resolved skill rules for run directives (`run_skill_script …`, `run skill …`, `run scripts/…`) and auto-dispatches matching scripts. | Same authorization, workspace, and sandbox path as tool-initiated runs. |

**Tool input schema**

```typescript
{
  skillName: string;           // required
  filename: string;            // required, e.g. "scripts/validate.py"
  specializationId?: string;   // optional override
  input?: Record<string, unknown>;  // JSON-serializable; may include PII
  env?: Record<string, string>;     // optional; allowlisted keys only
  args?: string[];             // optional; max 10 args, each max 256 chars
}
```

### 4.2 Sandbox execution contract

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-SB-1 | Scripts run in an **isolated sandbox** — not as raw `child_process` on the API/agent host. **Cloud:** Firecracker microVMs. **Local:** container- or microVM-based worker on the developer machine (architecture selects; see §4.9). | No unsandboxed script execution on agent service process in any environment. |
| FR-SB-2 | Supported languages: `python`, `nodejs`, `bash`, `terminal` — matching extended skill domain enum. | Language inferred from skill script metadata, not caller-supplied. |
| FR-SB-3 | **Strictly no network access** — no exceptions in Phase 1 or future script runs. Scripts requiring network must use **MCP tools** or **web-search tools** outside the sandbox. | Egress blocked at microVM level; verified by security test. |
| FR-SB-4 | **Shared task workspace** — scripts within the same task invocation share an ephemeral workspace directory; each script runs in an **isolated process**. | Script A can write files readable by Script B; workspace destroyed after invocation. |
| FR-SB-5 | **No host filesystem** access — workspace is sandbox-local only. | No access to host paths, other tenants, or platform storage. |
| FR-SB-6 | **No wall-clock timeout** — scripts run until completion or resource limit. | Agent blocks until done; no configurable per-run time cap. |
| FR-SB-7 | Memory limit: default **256 MB**; CPU limit: default **1 vCPU**. | OOM kills process; logged; LLM decides retry. |
| FR-SB-8 | Max script size: **512 KB** (inherits skill PRD). | Rejected at dispatch if storage content exceeds limit. |
| FR-SB-9 | Max stdout capture: **256 KB**; max stderr capture: **64 KB**. | Truncation flag set; remainder discarded. **Stdout only** returned as agent-facing output channel in Phase 1. |
| FR-SB-10 | Concurrent script runs within same workspace: **sequential by default**; architecture may allow limited parallelism with file-lock guidance. | No workspace corruption from concurrent writes. |
| FR-SB-11 | Exit code 0 = success; non-zero returned to agent without throwing and **without auto-failing the task**. | LLM interprets; errors may be expected per skill rule. |
| FR-SB-12 | **`terminal` language:** script content is executed as shell command(s) in the task workspace via `/bin/sh -c` or equivalent. | Commands run with same resource and network constraints as bash scripts. |

### 4.3 I/O model

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-IO-1 | **Primary input:** JSON object serialized and delivered to script per language convention. | May include PII and user document content. |
| FR-IO-2 | **Python:** JSON written to `input.json` in workspace; script reads from env `SKILL_INPUT_PATH` or argv `--input input.json`. | Default wrapper/bootstrap provided by worker. |
| FR-IO-3 | **Node.js:** JSON written to `input.json`; wrapper sets `process.env.SKILL_INPUT_PATH`. | ES module or CJS per architecture default. |
| FR-IO-4 | **Bash:** JSON written to `input.json`; env `SKILL_INPUT_PATH` set; `jq` available in sandbox. | `set -euo pipefail` per skill PRD. |
| FR-IO-5 | **Terminal:** JSON written to `input.json`; env `SKILL_INPUT_PATH` set; script body executed as shell command(s). | Filename convention: `scripts/{kebab-name}.terminal`. |
| FR-IO-6 | **Output:** **stdout only** returned to agent via tool response; stderr captured for debugging but not as primary output artifact. | No file upload or artifact persistence in Phase 1. |
| FR-IO-7 | **CLI args:** Optional `args: string[]` — max 10 args, each max 256 chars, no shell metacharacters. | Validated at tool boundary. |
| FR-IO-8 | **PII in transit:** input JSON encrypted in transit from agent service to sandbox (TLS/mTLS in cloud; secure local IPC or equivalent in local backend). | Security review sign-off per backend. |

### 4.4 Execution service architecture (requirements, not implementation)

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-ES-1 | Dedicated **execution worker** separate from agent invoke service. **Cloud:** Firecracker pool. **Local:** worker on developer machine. | Horizontally scalable in cloud; single-machine in local dev. |
| FR-ES-2 | Dispatch API accepts `{ language, scriptContent, input, env, workspaceId, limits, correlationId }`. | Internal only — not exposed to end users. |
| FR-ES-3 | **Sync RPC** — tool handler blocks until worker returns result. | No async poll pattern in Phase 1. |
| FR-ES-4 | Script content **cached** by `storageKey` hash with TTL (default 5 min). | Cache invalidation on skill update (best-effort). |
| FR-ES-5 | **Warm pools:** maintain N idle microVMs per language (configurable, default 2 per language per AZ). | Cold start metrics tracked separately. |
| FR-ES-6 | **Workspace isolation:** one workspace per task invocation (`workspaceId` = f(`taskId`, `rootInvocationId`)); **no shared state between tenants or tasks**. | Audit confirms isolation model. |
| FR-ES-7 | Correlation IDs: `taskId`, `invocationId`, `skillId`, `filename`, `workspaceId` propagated through dispatch and logs. | Traceable in observability backend. |
| FR-ES-8 | **Rule parser** component identifies auto-run directives in resolved skill rules and dispatches without LLM tool call. | Directive patterns documented; ambiguous cases fall back to LLM. |

### 4.5 Security

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-SEC-1 | **System-only tool** — personal agents cannot invoke script execution. | Registry `accessScope: SYSTEM_ONLY`. |
| FR-SEC-2 | Script content validated at **create_skill** boundary; static scan at dispatch blocks high-confidence dangerous patterns. | Block list configurable. |
| FR-SEC-3 | **No secret injection via `env` param** — only allowlisted keys: `SKILL_INPUT_PATH`, `SKILL_NAME`, `SKILL_FILENAME`, `TASK_ID`, `SKILL_WORKSPACE_PATH`. | User-supplied env keys rejected. |
| FR-SEC-4 | Platform secrets (API keys, DB credentials) **never** mounted into sandbox. | Verified by deployment review. |
| FR-SEC-5 | Script source not returned in tool response (only stdout/stderr). | Code stays server-side except admin REST. |
| FR-SEC-6 | Rate limiting per `taskId` and per `userId` (via task ownership). | Prevents abuse loops from misconfigured agents. |
| FR-SEC-7 | Audit log retention: execution metadata retained ≥ 90 days. | Configurable per deployment. |
| FR-SEC-8 | **PII handling:** input may contain PII; encrypted in transit to microVM; not logged at info level; workspace destroyed after invocation. | Security review sign-off. |
| FR-SEC-9 | **No network in sandbox** — permanent policy. Network-dependent operations use MCP or web-search tools assigned to the agent. | Egress test fails in CI. |

### 4.6 Sandbox technology — approved decision

| Option | Environment | Verdict |
|--------|-------------|---------|
| **Firecracker microVM** | Cloud production | **Approved** — primary isolation for cloud deployment |
| **Local sandbox worker** (Docker + gVisor, or local Firecracker) | Local development | **Approved** — first-class; runs entirely on developer machine |
| **WASM** | — | Rejected — insufficient language coverage |
| **isolated-vm (Node)** | — | Rejected — JS only |
| **Raw unsandboxed process** | — | Rejected in all environments |

**Decision:** Phase 1 delivers **two backends** behind one execution contract:

- **Cloud:** Firecracker microVMs on AWS (or cloud-equivalent), with pre-baked rootfs images (`python:3.12`, `node:20`, `bash+jq`, `terminal` shell base)
- **Local:** Fully local sandbox worker — **no cloud dependency**; selected automatically (or via config) when running the monorepo locally

Both backends implement the same sandbox contract (§4.2), I/O model (§4.3), workspace semantics, and tool response shape.

### 4.9 Local development runtime

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-LOC-1 | **Local backend is first-class in Phase 1** — not a degraded fallback or mock. | Feature is incomplete without working local sandbox. |
| FR-LOC-2 | Local sandbox runs as part of the **standard dev stack** (e.g. `pnpm run dev` or documented companion process). | Developer runs one command (or documented short sequence); no manual cloud setup. |
| FR-LOC-3 | **No cloud credentials** required for local script execution (no AWS keys, no remote worker URL). | `run_skill_script` works with only local MongoDB, local script storage, and local sandbox worker. |
| FR-LOC-4 | Config key `skills.execution.backend`: `local` \| `cloud` (default `local` in development, `cloud` in production). | Backend selected from env/config; same tool handler code path. |
| FR-LOC-5 | Local sandbox enforces the **same security contract** as cloud: no network egress, workspace isolation, resource limits, no host filesystem escape. | Local security tests mirror cloud policy tests. |
| FR-LOC-6 | Local prerequisites documented in package README (e.g. Docker, KVM where needed for local Firecracker). | Setup guide lists exact requirements; CI uses same local backend. |
| FR-LOC-7 | **Parity:** all four languages (`python`, `nodejs`, `bash`, `terminal`) execute locally with identical I/O contract. | Integration test passes locally without cloud. |
| FR-LOC-8 | Local logs include `sandboxBackend: "local"` on execution events for debugging. | Distinguishable in observability output. |

### 4.7 Integration with existing flows

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-INT-1 | Complements `resolve-skill` — agents resolve rule first; scripts run when rule instructs (auto-run) or agent calls tool. | Documented in worker agent rules. |
| FR-INT-2 | Compatible with **Task Skill Planning** — scripts authored during planning; execution during worker turns only. | Task Planner does not call `run_skill_script`. |
| FR-INT-3 | Works in **async task execution** (`executeTask`) — tool auto-assigned to task worker agents. | Integration test with task context. |
| FR-INT-4 | **Skill domain enum extended** with `terminal` language; GraphQL `SkillScriptLanguage` updated. | `create_skill` accepts `terminal`. |
| FR-INT-5 | Skill rules document script I/O contract and run directives when scripts are bundled. | QA spot-check on seeded skills. |
| FR-INT-6 | **Network operations** in skills delegate to MCP or web-search tools — never to sandbox scripts. | Documented in Skill Planner and worker rules. |

### 4.8 Configuration

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| FR-CFG-1 | Config namespace: `skills.execution` (or architecture-approved path). | Env-configurable limits, backend selection, and worker endpoints. |
| FR-CFG-2 | **Local development:** `skills.execution.backend=local` runs sandbox worker on developer machine; logs include `sandboxBackend: "local"`. | Full script execution without cloud; see §4.9. |
| FR-CFG-3 | **Production:** `skills.execution.backend=cloud` — Firecracker worker pool URL/credentials via existing config pattern. | No hardcoded endpoints. |
| FR-CFG-4 | Dev and prod share the **same dispatch API and tool handler**; only the sandbox backend implementation differs. | No forked tool logic per environment. |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Area | Target |
|------|--------|
| Tool handler dispatch (excl. script run) | p95 < 200 ms |
| Script content fetch (cache miss) | p95 < 500 ms |
| MicroVM cold start | p95 < 3 s from dispatch to process start |
| MicroVM warm execution (≤ 512 KB script) | p95 < 5 s end-to-end for short scripts |
| Script content cache hit | p95 < 50 ms fetch |
| Warm pool availability | ≥ 1 idle microVM per language per replica under normal load |

**"As fast as possible" strategy (required):**

1. **Warm microVM pools** — pre-initialized Firecracker VMs per language
2. **Script content cache** — in-memory/Redis keyed by `storageKey` + ETag
3. **Sync fast path** — co-locate worker pool with agent service in same region/AZ
4. **Minimal wrapper** — thin bootstrap; no package install at runtime
5. **Pre-baked rootfs** — Python, Node LTS, bash+jq, shell for terminal; no `pip install` / `npm install` at runtime
6. **Workspace reuse** — same microVM workspace reused across sequential script runs within a task invocation

### 5.2 Reliability

- Sandbox worker unavailable → tool returns retryable error; LLM may retry
- Storage read failure → fail fast with `script_file_missing` / `storage_error`
- Partial output preserved on OOM when available
- Long-running scripts supported — no wall-clock timeout

### 5.3 Security (summary)

- Defense in depth: authorization + Firecracker isolation + resource limits + **permanent no-network** + static scan + PII encryption in transit
- Assume scripts may be **LLM-generated** (untrusted code)
- Zero trust between tenants; workspace scoped per task invocation

### 5.4 Observability

| Event | Fields |
|-------|--------|
| `skill.script.run.started` | `taskId`, `skillId`, `skillName`, `filename`, `language`, `invocationId`, `workspaceId`, `trigger` (`tool` \| `rule`) |
| `skill.script.run.completed` | above + `exitCode`, `durationMs`, `stdoutBytes`, `stderrBytes`, `truncated` |
| `skill.script.run.failed` | above + `errorCode`, `errorMessage` (no script body, no PII) |
| `skill.script.run.rate_limited` | `taskId`, `userId` |

### 5.5 Platform

- New package(s): Firecracker execution service and/or sandbox worker (architecture TBD)
- Extends: `@vassembly/constants` (`SKILL_SCRIPT_LANGUAGES` + `terminal`), `@vassembly/client-langchain` schema, `services/agent` internal tool handler, `domains/skill` enum
- Reuses: `@vassembly/domain-skill` queries, existing script storage client
- Cloud deployment: **AWS Firecracker** (production)
- Local deployment: **fully local sandbox worker** — required in Phase 1; no cloud dependency (FR-LOC-1–FR-LOC-8)

---

## 6. Out of Scope (Phase 1)

| Item | Notes |
|------|-------|
| Script execution during **Task Planner / Skill Planner** phase | Planning remains execution-free |
| Personal agent script execution | System agents only |
| Admin UI "Run script" button | Future admin tooling |
| Task progress timeline integration | Phase 3 — deferred |
| `scriptRuns[]` on task document | Phase 3 — deferred |
| Runtime `pip install` / `npm install` | Pre-baked rootfs only |
| **Any network egress from sandbox** | Permanent — use MCP or web-search instead |
| Writable file outputs / artifact persistence to agent | Phase 4 — stdout only in Phase 1 |
| Wall-clock timeout on script runs | Explicitly excluded per stakeholder decision |
| Async job + poll pattern | Sync blocking only |
| Script debugging / step-through | Future |
| WASM or additional script languages beyond four | Future |
| Script versioning / rollback | Future governance |

---

## 7. Dependencies

| Dependency | Status | Impact if missing |
|------------|--------|-------------------|
| `domains/skill` — script metadata + storage | Exists — **enum extension needed** for `terminal` | Cannot persist terminal scripts |
| `getScriptContent` query + script storage client | Exists | Cannot load code |
| `resolve-skill` internal tool | Exists | Agents lack skill context |
| Internal tool registry pattern | Exists | Cannot expose run-skill-script |
| `InternalToolContext` (taskId, specializationIds) | Exists | Authorization incomplete |
| Firecracker / microVM infrastructure (cloud) | TBD | No production sandbox |
| Local sandbox runtime (Docker / local Firecracker) | TBD | No local dev script execution |
| Task worker agents with tool assignment | Exists — **seed update needed** | No execution entry point |
| MCP tools + web-search tools | Exist | Required alternative for network operations |

---

## 8. Acceptance Criteria (QA Checklist)

### Internal tool

- [ ] `run-skill-script` registered with `SYSTEM_ONLY` access
- [ ] Auto-assigned to specialization workers and task workers in seed
- [ ] Schema validates required `skillName`, `filename`
- [ ] `specializationId` resolution matches `resolve-skill` precedence
- [ ] Disabled/archived/cross-scope skills rejected
- [ ] Successful run returns exitCode, stdout, stderr, durationMs
- [ ] Non-zero exit code returns output without handler throw or task auto-fail
- [ ] Agent turn blocks until script completes (no wall-clock timeout)
- [ ] Oversized stdout/stderr truncated with `truncated: true`

### Local development

- [ ] `skills.execution.backend=local` runs scripts without cloud credentials
- [ ] Local sandbox starts with standard dev stack (or documented one-step setup)
- [ ] All four languages execute locally with same I/O contract as cloud
- [ ] Local execution enforces no network egress and workspace isolation
- [ ] Logs include `sandboxBackend: "local"`

### Sandbox

- [ ] Scripts run in isolated sandbox outside agent service host (Firecracker in cloud; local worker locally)
- [ ] Python, Node.js, Bash, and Terminal all execute correctly
- [ ] No network egress (verified by test)
- [ ] No wall-clock timeout — long script completes successfully
- [ ] Memory limit enforced
- [ ] Shared workspace across sequential runs within same task invocation
- [ ] Workspace isolated per task/tenant
- [ ] JSON input delivered per language contract; PII encrypted in transit

### Rule auto-run

- [ ] `run_skill_script …` directive in rule triggers auto-run
- [ ] `run skill …` / `run scripts/…` directives trigger auto-run when unambiguous
- [ ] Auto-run uses same sandbox path as tool-initiated runs

### Security

- [ ] Personal agents cannot assign or invoke tool
- [ ] Non-allowlisted `env` keys rejected
- [ ] Script source and PII not in info logs
- [ ] Rate limit triggers on excessive runs

### Integration

- [ ] Tool works during `executeTask` with task context
- [ ] Task Planner does not have tool assigned
- [ ] `terminal` language accepted by `create_skill` and GraphQL
- [ ] Gherkin scenarios SSE-1 through SSE-11 covered

### Observability

- [ ] Structured logs for started/completed/failed with `trigger` field
- [ ] Correlation IDs present in logs

---

## 9. Approved Decisions (2026-07-01)

| # | Question | Decision |
|---|----------|----------|
| D-1 | Trigger model | **Both** — LLM calls `run_skill_script` directly **and** platform auto-runs on rule directives (`run_skill_script …`, `run skill …`, `run scripts/…`) |
| D-2 | Sync vs async | **Sync blocking** — agent waits until script finishes; **no wall-clock timeout** |
| D-3 | Tool assignment | **Auto-assign** `run-skill-script` to specialization workers and task workers |
| D-4 | Input sensitivity | **Yes** — `input` may carry PII; encrypt in transit to microVM; audit without logging PII at info level |
| D-5 | Output artifacts | **Stdout only** in Phase 1 — no file artifact upload |
| D-6 | Network | **Strictly no network** in sandbox — use **MCP** or **web-search tools** for network access |
| D-7 | Multi-script workspace | **Shared workspace** across script runs within a task invocation; each script runs in an **isolated process** |
| D-8 | Failure policy | **LLM decides** — non-zero exit does not auto-fail task; errors may be expected |
| D-9 | Release scope | **Phase 1 only** — no Phase 3 task integration in this release |
| D-10 | Sandbox technology | **Firecracker microVM** for cloud production |
| D-11 | Script language | Add **`terminal`** — runs arbitrary shell commands from script content |
| D-12 | Local development | **First-class local sandbox** — entire stack runs on developer machine without cloud; same execution contract as production; `skills.execution.backend=local` in dev |

---

*End of PRD — approved for architecture. Next: `docs/features/skill-script-execution/architecture.md`.*
