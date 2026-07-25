# Product Requirements Document: MCP Usage Tracking

**Document status:** Draft for engineering, design, and QA handoff
**Last updated:** 2026-07-25
**Feature slug:** `mcp-usage-tracking`
**Related:** [Agent MCP Assignment](../agent-mcp-assignment/prd.md) · [MCP Configuration Management](../mcp-configuration-management/prd.md) · [Real-Time Agent Execution Progress](../real-time-execution-progress/prd.md) · [Task Detail Page](../task-detail-page/prd.md)

---

## 1. Problem Statement

When an agent uses an MCP tool during task execution, that invocation is invisible today. `runToolCallLoop` in `client-langchain` calls `tool.invoke(args)` and the agent service only returns an aggregate `mcpIdsUsed` list — no per-invocation record is created or persisted anywhere.

This creates two gaps:

1. **On the Task Detail Page**, the activity/progress feed shows agent LLM steps (via `domain-task-progress`) but nothing about which MCP tools ran, what they were called with, when, or how long they took. Users debugging a task or trying to understand *why* an answer looks the way it does cannot see the tool calls that produced it.
2. **On the MCP Detail Page**, there is no usage history at all — only static agent-assignment counts. Users configuring and troubleshooting an MCP (e.g. "is my Gmail MCP actually being called? is it slow? is it erroring?") have no way to find out without server-side log access.

Without persisted, per-invocation MCP usage records, neither surface can be built, and there is no audit trail for tool calls that may touch user data or external systems.

---

## 2. User Stories

### Persona: End User (task creator / MCP owner)

**US-1 — See MCP activity within a task**
As a user viewing a task I created, I want to see which MCP tools were invoked as part of the agent's work, in the same timeline as other progress activity, so that I understand what actions were taken on my behalf and can verify correctness.

**US-2 — Inspect a single MCP invocation from a task**
As a user viewing task activity, I want to see the MCP name, tool name, start/end time, and duration for each MCP call, so that I can spot slow or repeated calls without digging into logs.

**US-3 — See usage history for one of my MCPs**
As a user who configured an MCP, I want to open that MCP's detail page and see a history of when it was used, by which agent/task, which tools were called, and how long each call took, so that I can confirm the integration is working and understand its usage pattern.

**US-4 — Trust that sensitive data isn't casually exposed**
As a user, I want tool call inputs shown in usage history to be handled carefully (not silently dumping raw secrets or full unredacted payloads to any viewer), so that I'm not worried about leaking sensitive information through the tracking feature itself.

### Persona: Admin / Platform Operator (secondary, if applicable)

**US-5 — Diagnose MCP reliability across users**
As a platform operator, I want MCP invocation records to be queryable by MCP and by outcome (success/error), so that I can identify MCPs or tools with high failure rates or latency issues.
*(v1: satisfied by the same persisted records being queryable at the data layer; no dedicated admin UI required — see Out of Scope.)*

---

## 3. Acceptance Criteria (Given/When/Then)

### AC-1 — Recording an MCP invocation

```gherkin
Scenario: Agent invokes an MCP tool successfully
Given an agent is executing a task and has an assigned MCP with a bound tool
When the agent invokes the tool via the tool-call loop
Then a usage record is created with: mcpId, tool name, userId, taskId, agentId, invocationId, startedAt, endedAt, durationMs, status "success"
And the record is persisted before the tool-call loop returns control to the caller
And the aggregate mcpIdsUsed behavior on invoke responses continues to work unchanged

Scenario: Agent invocation of an MCP tool fails
Given an agent is executing a task and invokes an MCP tool
When the tool call throws an error or times out
Then a usage record is created with status "error" and a human-readable error message
And the tool-call loop error handling behavior is unchanged (recording must not swallow or alter the original error)

Scenario: Recording failure must not break task execution
Given the usage-tracking write (command) fails (e.g. transient DB error)
When an MCP tool call otherwise completes successfully
Then the tool result is still returned to the agent/task flow
And the recording failure is logged but does not fail the task
```

### AC-2 — Task Detail Page: progress list shows MCP activity

```gherkin
Scenario: MCP invocation appears in task activity timeline
Given a task has at least one MCP tool invocation recorded during its execution
When a user opens that task's Task Detail Page
Then the activity/progress list includes an entry for each MCP invocation
And each MCP tool call produces **two** timeline entries: one when the call **starts**, and one when it **completes** (success or error) with duration
And MCP entries are chronologically merged with existing agent progress events (same timeline)

Scenario: Task with no MCP usage shows no MCP entries
Given a task's agent had no assigned MCPs or made no tool calls
When a user opens the Task Detail Page
Then no MCP-related entries appear in the activity list
And existing (non-MCP) progress entries render exactly as before
```

### AC-3 — MCP Detail Page: usage history section

```gherkin
Scenario: User views usage history for their configured MCP
Given the current user has one or more recorded invocations of an MCP they configured
When they open that MCP's detail page
Then a "Usage history" section is shown listing invocations
And each row represents **one tool invocation** (not separate start/complete rows): who used it (agent/task context), tool invoked, timestamp, duration, and **status** (`in_progress` → `success` / `error`)
And rows are ordered most-recent first
And in-progress rows update to their final status on the same row when data refreshes (same polling pattern as the rest of the page)
And the section paginates when usage exceeds the default page size

Scenario: MCP with no usage history shows empty state
Given the current user has configured an MCP but it has never been invoked
When they open that MCP's detail page
Then the "Usage history" section shows an empty state message
And no error is thrown

Scenario: Usage history is scoped to the owning user
Given user A has usage records for "Gmail MCP"
And user B has also configured "Gmail MCP" with their own credentials
When user B opens the Gmail MCP detail page
Then user B sees only their own usage records, never user A's
```

### AC-4 — Tool input visibility

```gherkin
Scenario: Tool arguments are viewable but protected by default
Given a recorded MCP invocation captured tool call arguments
When a user with access to that record views the usage history entry
Then any input value is either redacted/masked or explicitly opt-in expandable
And no raw credential/secret material is ever displayed, regardless of user action
```

---

## 4. Edge Cases

```gherkin
Scenario: Concurrent tool calls within the same invocation
Given an agent invocation makes multiple MCP tool calls in parallel or in quick succession
When usage records are written
Then each tool call produces its own distinct record (no overwriting or merging)
And ordering in the UI reflects actual start times, not write-completion order

Scenario: MCP is deleted/unconfigured after usage was recorded
Given a user deleted their MCP configuration
And usage records referencing that mcpId already exist
When the user (still) views task activity or attempts to view the MCP detail page
Then previously recorded task-activity entries still render using stored MCP name/tool at time of use (no broken lookups)
And the MCP detail page itself is inaccessible/removed per existing MCP deletion behavior, independent of this feature

Scenario: Very long-running or hanging tool call — Task Detail Page
Given an MCP tool call has started but not yet returned
When a user views the task activity before it completes
Then a **"started"** timeline entry is shown (no duration yet)
And when the call completes, a separate **"completed"** or **"failed"** timeline entry appears with duration
And both entries remain in the timeline (start is not replaced by completion)

Scenario: Very long-running or hanging tool call — MCP Detail Page
Given an MCP tool call has started but not yet returned
When a user views MCP usage history before it completes
Then a single row shows status `in_progress` without a duration
And the same row updates to `success` or `error` with duration on next data refresh (no second row for completion)

Scenario: Tool call arguments are very large
Given a tool call argument payload exceeds a reasonable display size (e.g. large document content)
When the usage record is created
Then the stored/displayed input is truncated with an indicator, rather than breaking the UI or bloating storage unbounded

Scenario: High-volume MCP usage on a single task
Given a task triggers dozens or hundreds of MCP tool calls
When the user opens the Task Detail Page
Then the activity list remains performant (paginated/virtualized or capped) rather than rendering unbounded entries inline

Scenario: MCP invocation outside of a task context
Given an MCP tool is invoked in a context without a taskId (if such a path exists)
When a usage record is created
Then the record is still persisted and visible on the MCP Detail Page
And it is simply omitted from any task-scoped activity list (no taskId to attach to)
```

---

## 5. Out of Scope (v1)

- Dedicated admin/ops dashboard for cross-user MCP reliability metrics (data is persisted and queryable, but no new admin UI).
- Real-time push/streaming updates to either UI; usage entries appear via the same refresh/poll mechanism already used by their respective pages (no new WebSocket infra).
- Filtering, search, or sorting controls on usage history beyond default reverse-chronological order and pagination.
- Editing, deleting, or manually annotating usage records.
- Exporting usage history (CSV/JSON).
- Retry/replay of a failed MCP invocation from the UI.
- Aggregate analytics (e.g. total calls per MCP per week, cost/latency trends, charts).
- Usage tracking for MCP "test connection" actions (only actual agent-driven tool invocations during task execution are tracked).
- Configurable data retention/TTL policy (a default retention approach should exist, but tuning/admin controls are deferred).
- Full unredaction/reveal-on-demand UX for tool inputs beyond a simple masked/expand affordance (see Section 7).

---

## 6. Success Metrics

| Metric | Target (MVP) | Measurement |
|--------|---------------|-------------|
| Recording coverage | 100% of MCP tool invocations during task execution produce a usage record (success or error) | Compare tool-call-loop invocation count vs. persisted record count in test/staging |
| Recording overhead | Adds ≤ 50ms (p95) to a single tool call due to persistence | Timing instrumentation around the record-write call |
| Task activity accuracy | 100% of recorded MCP invocations for a task appear in that task's activity list on next load | QA verification across sample tasks |
| MCP detail adoption | ≥ 1 MCP detail page view of "Usage history" per active configured MCP per week (directional, post-launch) | Frontend analytics/page view event |
| Non-blocking recording | 0 task failures attributable to usage-recording errors | Error monitoring / logs review |
| Privacy compliance | 0 raw secrets/credentials ever rendered in usage history (input redaction verified) | Security review + QA spot-check |

---

## 7. Privacy & Security Requirements for Logging Tool Inputs

Tool call arguments may legitimately contain sensitive data: email addresses, document contents, search queries, or — in misconfigured/edge cases — credentials accidentally passed as arguments. The feature must not turn MCP usage tracking into a new leak vector.

1. **Access scoping (mandatory).** A user may only ever see usage records tied to their own MCP configurations (by `userId` + `mcpId`/config ownership) and only within tasks they own. No cross-user visibility in v1, including for admins (no admin UI in scope — see Section 5).
2. **No credential capture.** Known credential/secret-shaped fields (API keys, tokens, passwords) must never be persisted as part of recorded tool input, regardless of what the tool schema names its arguments. Apply a deny-list/heuristic filter before persistence, not just before display.
3. **Default masking on display.** Tool input is not shown in full plaintext by default in either UI; it is masked/collapsed with an explicit user action required to expand it. This is a UX safeguard, not a substitute for #2.
4. **Truncation, not unbounded storage.** Large inputs are truncated at persistence time to a bounded size to avoid unbounded document growth and to reduce the blast radius of any single record.
5. **Retention.** Usage records should have a default retention window (exact duration TBD with engineering/legal; align with existing task/progress retention if a precedent exists) rather than being kept indefinitely by default.
6. **No sensitive data in error messages.** Error messages captured on failed invocations must be sanitized the same way as successful-call inputs — stack traces or raw provider error bodies must not leak secrets.
7. **Audit-appropriate immutability.** Once written, a usage record should not be editable by end users (view-only), preserving its value as a lightweight audit trail.
8. **No logging of MCP output payloads in v1** beyond what's needed for correctness of the duration/status fields — full response bodies are not required for MVP display and should not be persisted just because they're available, to minimize sensitive-data surface area.

---

## 8. Notes for Engineering (non-binding context, not implementation direction)

- Reads must use GraphQL, writes/recording must use REST, per repo-wide API conventions — recording is an async command triggered from the agent service after/around each tool call.
- Existing patterns to reuse for consistency: `domain-task-progress` (task-scoped event domain) and `getTaskActivityTimeline` (merging heterogeneous activity item types) for the Task Detail Page integration; the MCP Detail Page's existing stacked-section layout (no tabs) for placing "Usage history".
- The agent service already has the needed context (`userId`, `taskId`, `agentId`, `commentId`, `invocationId`) at the point tools are invoked in `runToolCallLoop` — this PRD assumes that context is threaded through to the new recording call, but the specific implementation (new domain vs. extension of an existing one) is an architecture decision, not a product decision.

---

## 9. Product Decisions (resolved)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Retention period | **90 days** — usage records auto-delete after 90 days (MongoDB TTL). See architecture §8. |
| 2 | Task-less invocations | Persist; visible on MCP Detail only (default). |
| 3 | High-volume tasks | Cap task-activity MCP entries at **50 most recent** per task if needed for performance (default). |
| 4 | Input reveal UX | Masked by default; expand for sanitized values (default). |
| 5 | In-progress UX | **Task Detail:** two timeline events per call (start + complete/error). **MCP Detail:** one row per call, status updates in place. |
| 6 | Delivery | **All phases in one implementation** — do not wait for MCP platform branch merge. |
| 7 | E2E scope | Playwright for recording + display + redaction (default). |

---

*Document version: 1.1 — Decisions incorporated.*
