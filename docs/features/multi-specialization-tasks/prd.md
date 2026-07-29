# Product Requirements Document: Multi-Specialization Tasks

**Document status:** Approved for architecture handoff
**Last updated:** 2026-07-29
**Related docs:** [Specialization](../specialization/prd.md) · [Task Skill Planning](../task-skill-planning/prd.md) · [Task Plan](../task-plan/prd.md) · [Task Comment Conversation](../task-comment-conversation/prd.md) · [Real-Time Execution Progress](../real-time-execution-progress/architecture.md) · [MCP Tool Naming and Selection](../mcp-tool-naming-and-selection/architecture.md)
**Feature slug:** `multi-specialization-tasks`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [Decisions](#3-decisions)
4. [Classification Rules](#4-classification-rules)
5. [Task Plan Splitting Semantics](#5-task-plan-splitting-semantics)
6. [Activity Feed Visibility for Classifier Invocations](#6-activity-feed-visibility-for-classifier-invocations)
7. [User Stories (Gherkin)](#7-user-stories-gherkin)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)
11. [Out of Scope](#11-out-of-scope)
12. [Supersedes / Conflicts](#12-supersedes--conflicts)
13. [Dependencies](#13-dependencies)
14. [Acceptance Criteria (QA Checklist)](#14-acceptance-criteria-qa-checklist)
15. [Open Questions](#15-open-questions)

---

## 1. Executive Summary

### 1.1 Problem

[Specialization](../specialization/prd.md) and [Task Skill Planning](../task-skill-planning/prd.md) already support a task carrying **multiple** specialization IDs (`task.specializationIds: string[]`, `taskComment.specializationIds: string[]`), and the Task Planner already emits **one plan item per specialization worker**. In practice, however, the Specialization Classifier almost always assigns exactly one specialization, even when a request clearly spans multiple domains.

Example: *"Create a summary in my Notion about the 20 most popular meals"* should be classified into **both** "food & nutrition" (the subject matter) and "notion" (the delivery platform/tool). Today it is classified into only one of the two, and the resulting plan cannot properly split "research meals" from "write to Notion" work.

Root causes identified during discovery:

- **Parser is either/or, not both/and.** `normalizeGeneratedSpecializations` treats a `NEW:` line as an exclusive branch — if the classifier's raw output contains both existing-specialization lines and a `NEW:` line, the existing matches are discarded and only the new specialization is returned (or vice versa, depending on which check runs first). The classifier can never return "2 existing + 1 new" in one classification pass.
- **Cap is too low.** The result is capped at 3 total lines/results (`MAX_SPECIALIZATION_RESULTS = 3`), which is tight once tool/platform specializations (e.g., "notion", "slack", "github") are expected to be recognized as full specializations alongside subject-matter domains.
- **The classifier prompt explicitly discourages multiplicity.** The seeded rule text for `"Specialization classifier"` says *"Prefer fewer specializations"* — actively biasing the LLM toward single-specialization answers even when the task is legitimately multi-domain.
- **No signal that tools/platforms should be treated as specializations.** The classifier prompt has no guidance that a named platform or tool (Notion, Slack, GitHub, etc.) mentioned in a task should be recognized as its own specialization the same way a subject-matter domain would.
- **The classifier itself is invisible in the activity feed.** `classifyCommentSpecializations` invokes the "Specialization classifier" system agent via `runAgentInvokeWithTools` with `credentialScope: 'platform'`, and the progress-recording callback (`toolContext.recordAgentInvokeProgress`) is intentionally skipped for platform-credential invocations. Every other subagent invocation in a comment's execution turn (researchers, Task Planner, workers, validators) is recorded to `domain-task-progress` and rendered in `TaskActivityFeed`; the classifier's LLM call currently is not, leaving users and admins with no visibility into what the classifier saw or decided.

### 1.2 Solution

1. **Fix the classifier parser and prompt** so a single classification pass can return a **mixed set** of existing specialization IDs **and** newly created specializations in one result, raise the maximum result count, remove the "prefer fewer" bias, and add explicit guidance that tools/platforms mentioned by name are eligible for their own specialization.
2. **Inject MCP catalog hints** into the classifier's context (name + description of available MCPs/tools) so the classifier can recognize when a mentioned platform corresponds to a tool the platform already integrates with, improving specialization naming consistency (e.g., consistently naming the Notion specialization "notion" rather than "note-taking" or "productivity").
3. **Clarify plan-splitting semantics** for the already-existing "one plan item per specialization worker" behavior so that when a task spans a subject-matter specialization and a tool/platform specialization, the Task Planner produces explicitly ordered steps (research/content work before delivery/persistence work), rather than leaving cross-specialization ordering to chance.
4. **Make classifier invocations visible in the activity feed** with the same fidelity as other subagent invocations — full input, output, timing, token usage, and outcome (which specializations were matched/created) — so end users and admins can audit why a task was routed the way it was.

This PRD does **not** introduce a classification-quality observability metric (explicitly out of scope, see §11) and does **not** change how specialization agent sets (researcher/worker/validator) are provisioned — it changes only **how many** specializations a task/comment can receive in one classification pass, **what signals** the classifier uses, and **how that classification is surfaced** to users.

### 1.3 Success Metrics

| Metric | Target (60 days post launch) | Measurement |
|--------|-------------------------------|-------------|
| Multi-domain coverage | ≥ 90% of sampled multi-domain prompts (subject + tool/platform mention) receive ≥ 2 specialization IDs | Manual/admin spot-check sample of 50 prompts |
| Mixed existing+new classification correctness | 100% of classification passes that should return both existing and new specializations do so in a single pass (no dropped branch) | Unit tests on `normalizeGeneratedSpecializations` + integration test with mixed fixture |
| Cap enforcement | 0 tasks/comments with more than 5 `specializationIds` | DB assertion / unit test |
| Activity feed coverage | 100% of comment execution turns that invoke the Specialization Classifier show a classifier entry in the activity feed | E2E test + manual QA |
| Tool/platform recognition | ≥ 80% of prompts naming a cataloged MCP-backed platform (e.g., Notion, Slack, GitHub) receive a specialization matching or referencing that platform | Manual/admin spot-check sample |

### 1.4 Phasing Summary

| Phase | Deliverable |
|-------|-------------|
| **Phase 1 — Classifier correctness** | Parser fix (mixed existing+new), cap raised to 5, "prefer fewer" rule removed from seed prompt, MCP catalog hints injected into classifier context |
| **Phase 2 — Plan splitting clarity** | `formatTaskPlannerPlanningSection` updated with explicit cross-specialization ordering guidance (research/content order before delivery/persist order) |
| **Phase 3 — Activity feed visibility** | Classifier invocation recorded to `domain-task-progress` and rendered in `TaskActivityFeed` with the same detail as other subagent invocations |

Phases are documented for engineering sequencing; all three are in scope for this PRD.

---

## 2. User Personas

| Persona | Description | Primary interaction |
|---------|-------------|----------------------|
| **End User** | Submits tasks/comments that may span multiple domains (subject matter + tools/platforms) | Sees multiple specialization tags on the task/comment (Phase 3 of [Specialization](../specialization/prd.md)); sees a classifier entry in the activity feed |
| **Platform Admin** | Audits classification quality and specialization catalog growth | Views classifier activity feed entries with full input/output; views specialization detail pages for tool/platform specializations |
| **Specialization Classifier (system agent)** | LLM agent invoked once per comment turn to assign specialization(s) | Returns a mixed list of existing specialization names and/or `NEW:` entries in a single pass; now receives MCP catalog hints |
| **Task Planner (system agent)** | Consumes `task.specializationIds` / `comment.specializationIds` to produce one plan item per specialization worker | Applies explicit cross-specialization ordering (research/content before delivery/persist) |

---

## 3. Decisions

| # | Question | Decision |
|---|----------|----------|
| D-1 | Tool-as-specialization | **Yes** — a named platform/tool (e.g., Notion, Slack, GitHub) mentioned in a task is eligible for its own specialization, exactly like a subject-matter domain. MCP-backed tool access and specialization are **complementary, not mutually exclusive**: a "notion" specialization may use the Notion MCP for direct API actions but can also perform broader Notion-related reasoning/work beyond what the MCP itself exposes. |
| D-2 | Mixed existing + new specializations | **Yes** — a single classification pass may return **both** IDs of existing specializations **and** newly created specializations. Existing matches are never discarded because a new specialization is also needed in the same pass. |
| D-3 | Maximum specializations per task/comment | Raised from **3 → 5** |
| D-4 | "Prefer fewer specializations" rule | **Removed entirely** from the classifier's seeded rule text. The classifier is guided to assign as many specializations as genuinely apply (up to the cap), not to minimize count. |
| D-5 | MCP catalog hints in classifier context | **Yes** — MCP/tool names (and short descriptions) from the MCP catalog are injected into the classifier's prompt context so it can recognize tool/platform mentions and align specialization naming with the existing MCP catalog. |
| D-6 | Classification quality metric | **No** — no new observability metric for classification quality/accuracy is introduced in this PRD (explicitly deferred). |
| D-7 | Classifier activity feed visibility | **Yes (new requirement)** — Specialization Classifier invocations must be recorded and rendered in the task activity feed with the same fidelity as other subagent invocations (researchers, Task Planner, workers, validators): full input, output, duration, token usage, and classification outcome. |
| D-8 | Task plan splitting for cross-domain tasks | Existing "one plan item per specialization worker" behavior is retained; this PRD adds **explicit ordering rules** so subject-matter/research work is sequenced before delivery/persistence work across specializations, rather than leaving order to LLM judgment alone. |

---

## 4. Classification Rules

This section defines the **behavioral contract** for the Specialization Classifier once this PRD ships. It supersedes the single-specialization framing in [Specialization](../specialization/prd.md) §3 SP-2 and §8.3.

### 4.1 When to assign one specialization vs. many

- The classifier evaluates the **full task/comment content** (goal description + prior comments as context, per existing `buildCatalogMessage` behavior) and identifies **every distinct domain** genuinely required to fulfill the request — not just the most prominent one.
- A "domain" includes both:
  - **Subject-matter domains** — the topic/knowledge area the work is about (e.g., "food & nutrition", "legal", "finance").
  - **Tool/platform domains** — a named external tool, platform, or service the work must interact with (e.g., "notion", "slack", "github") — see §4.2.
- **Single specialization** is assigned when the request is entirely self-contained within one domain and does not name any external platform/tool that itself qualifies as a distinct domain (e.g., "draft an NDA" → legal only).
- **Multiple specializations** are assigned when the request spans (a) a subject-matter domain **and** a delivery/tool domain, (b) two or more distinct subject-matter domains, or (c) two or more distinct tool/platform domains.
- The classifier does **not** artificially split a single coherent domain into multiple specializations (e.g., "research and summarize NDA clauses" stays "legal" — it is not split into "research" + "summarization").

### 4.2 Tool-as-specialization detection

- When a task/comment names a specific platform or tool (e.g., "in my Notion", "post to Slack", "open a GitHub issue"), the classifier treats that platform as its own specialization candidate, using the **same matching/creation logic** as subject-matter domains (match existing specialization by name, or emit a `NEW:` entry).
- Tool/platform specialization naming should align with the **MCP catalog hints** injected into context (§4.4) when a corresponding MCP exists, so the specialization name matches the platform consistently across tasks (e.g., always "notion", never "note-taking-app" for the same platform).
- A tool/platform specialization is **not required** to have an installed/active MCP at classification time — the specialization can be created even if no MCP is yet mapped to it (MCP mapping is handled by the existing MCP Specialization Classifier flow per [Specialization](../specialization/prd.md) §4.3, unchanged by this PRD).
- Tool/platform specializations **coexist** with MCP tool access rather than replacing it: an agent under a tool/platform specialization may call the platform's MCP for concrete actions (e.g., "create Notion page") while also handling broader reasoning/content work related to that platform that is not itself an MCP call (e.g., "decide what the Notion page's structure should be").

### 4.3 Mixed existing + new specializations in one pass

- The classifier's raw output may contain **any combination** of:
  - Lines naming existing specializations (matched case-insensitively against the catalog, per existing `normalizeGeneratedSpecializations` logic), and
  - One or more `NEW:name|description` lines for domains with no existing match.
- The parser MUST return **all** valid matches from **both** categories in a single result — an output containing 2 existing-specialization lines and 1 `NEW:` line resolves to 3 total specializations (2 existing IDs + 1 newly created ID), not just one or the other.
- Multiple `NEW:` lines in a single pass are supported (e.g., two genuinely new domains detected at once), each independently created (or matched idempotently if a same-named specialization was created concurrently, per existing `create-specialization` idempotency in [Specialization](../specialization/prd.md) FR-IT-3).

### 4.4 MCP catalog hints in classifier context

- The classifier's prompt context is extended to include the **name and short description of each active MCP** in the catalog (mirroring the existing MCP Specialization Classifier's catalog-injection pattern from [Specialization](../specialization/prd.md) §4.3 FR-MC-3), so the classifier can recognize when a mentioned platform corresponds to an already-integrated tool.
- MCP catalog hints are **advisory context only** — they inform naming and detection of tool/platform specializations; they do not constrain which specializations can be created (a tool/platform specialization can still be created for a platform with no MCP yet).
- Catalog size/truncation handling follows the same approach as the existing MCP Specialization Classifier prompt construction (see [Specialization](../specialization/prd.md) OQ-3) — no new truncation strategy is introduced by this PRD.

### 4.5 Cap and "prefer fewer" removal

- Maximum specializations returned per classification pass: **5** (raised from 3).
- The classifier's seeded rule text no longer contains any instruction to minimize or prefer fewer specializations. The only limiting instruction is the numeric cap itself.
- If genuine classification would exceed 5 domains, the classifier is instructed to select the **5 most central/necessary** domains to the request (see Edge Cases §10 for over-cap handling).

---

## 5. Task Plan Splitting Semantics

This section clarifies (does not redesign) the existing "one plan item per specialization worker" behavior from [Task Skill Planning](../task-skill-planning/prd.md) TP-5/FR-TP-9 and `formatTaskPlannerPlanningSection.ts`, now that classification routinely produces more than one specialization per comment.

### 5.1 One plan item per specialization worker (existing, retained)

- The Task Planner continues to emit **exactly one plan item per specialization worker** referenced by the comment's `specializationIds` (unchanged from current `formatTaskPlannerPlanningSection` rule 3: "One plan item per specialization worker").
- Each item's `agentName` is the exact worker agent name for that specialization (e.g., "Food & nutrition worker", "Notion worker").

### 5.2 Cross-specialization ordering (new, explicit)

- When a comment has ≥ 2 specializations, the Task Planner assigns `order` values so that **research/content-producing** specialization work precedes **delivery/persistence** specialization work:
  - **Order 1 (research/content):** subject-matter specialization items whose output is knowledge, analysis, or generated content needed by a later step (e.g., "Food & nutrition worker" producing the list of 20 popular meals).
  - **Order 2 (delivery/persist):** tool/platform specialization items that take the prior step's output and perform the platform action (e.g., "Notion worker" creating the Notion page/summary from the meals list).
- Specializations with **no dependency** on each other's output (e.g., two independent subject-matter domains both needed for the same request, neither feeding the other) may share the same `order` and run in parallel, per existing [Task Plan](../task-plan/prd.md) §4.1 parallel-execution semantics.
- A tool/platform specialization item that has **no upstream dependency** (e.g., "post a status update to Slack" with no research step) is order 1 by itself — the ordering rule applies **only when** one specialization's work is a documented input to another's.

### 5.3 Worked example — "Create a summary in my Notion about the 20 most popular meals"

| Step | Specialization | Worker item | Order | Rationale |
|------|-----------------|-------------|-------|-----------|
| 1 | Food & nutrition | "Research and compile the 20 most popular meals with a brief summary of each" | 1 | Produces the content the delivery step needs |
| 2 | Notion | "Create a Notion page containing the summary of the 20 most popular meals produced in the prior step" | 2 | Consumes step 1's output; performs the platform action |

This example is the canonical scenario referenced throughout this PRD's Gherkin stories (§7.1, MSC-1) and should be used as the primary QA/E2E fixture.

### 5.4 No change to plan persistence mechanics

- Plan template/instance persistence, per-item execution status, retry, and null-`skillId` inline skill creation semantics are **unchanged** — see [Task Plan](../task-plan/prd.md) for the full execution model. This PRD only changes **how many** specializations feed into plan-item generation and **how their order is decided** when more than one applies.

---

## 6. Activity Feed Visibility for Classifier Invocations

### 6.1 Problem statement

`classifyCommentSpecializations` invokes the "Specialization classifier" system agent via `runAgentInvokeWithTools` with `credentialScope: 'platform'`. In the current implementation, the progress-recording callback (`toolContext.recordAgentInvokeProgress`) is only wired for non-platform credential invocations — platform-credential calls are not recorded to `domain-task-progress`. As a result, unlike researchers, the Task Planner, workers, and validators (all of which run through `executeTask`'s progress-recording wiring, e.g. `createRecordAgentInvokeProgress`), the classifier's LLM invocation currently produces **no entry** in `TaskActivityFeed`.

### 6.2 Requirement

Specialization Classifier invocations MUST appear in the task activity feed as a distinct entry, with the same level of detail as other subagent invocation entries (researchers, Task Planner, workers, validators):

- Agent name ("Specialization classifier")
- Input (the classification message built from the comment's description/context)
- Output (raw classifier response) and the **parsed classification outcome** (which existing specialization(s) matched, which new specialization(s) were created, or that classification was skipped and why)
- Timing (start time, duration)
- Token usage (when available from the LLM call, consistent with other progress events)
- Status (completed / skipped / failed) and, for failures, the error detail

This applies regardless of the credential scope used for the underlying LLM call — the classifier's invocation must be recorded even though it runs with a platform-scoped credential rather than the user's own credential.

### 6.3 Placement in the feed

- The classifier entry appears in feed order at its `occurredAt` timestamp, **before** the researcher/Task Planner/worker/validator entries for the same comment turn (classification happens first, ahead of Assistant/Task Planner orchestration), consistent with the existing chronological ordering convention in `TaskActivityFeed`.
- The classifier entry is visually a **subagent invocation row** (matching the pattern already used for researchers/workers/validators — see `ActivityMcpInvocationRow` / progress-event row conventions), not a new, bespoke card type, so it is visually consistent with the rest of the feed.
- When classification results in a new specialization being created (`type: 'new'`), the entry additionally surfaces the created specialization's name so users can see a new specialization was introduced as a direct result of this turn.
- When classification is skipped (e.g., short description, already-classified comment, malformed output), the entry still renders with a "skipped" status and the skip reason — mirroring how other skip/no-op states are surfaced elsewhere in the feed.

### 6.4 Scope boundary

- This requirement covers **only** the Specialization Classifier invocation triggered by `classifyCommentSpecializations` (the live, comment-time classification path). It does not apply to the dead/unused `runTaskSpecializationClassification.ts` code path, which is out of scope for this PRD (see §11).
- The MCP Specialization Classifier (a separate system agent triggered only on new-specialization creation, per [Specialization](../specialization/prd.md) §4.3) is **not** required by this PRD to appear as its own feed entry — it is not explicitly requested in scope and is not part of the per-comment execution turn a user is actively watching. Whether to extend visibility to it is noted as an open question (§15).

---

## 7. User Stories (Gherkin)

IDs: `MSC-N` (multi-specialization classification), `MSP-N` (multi-specialization plan splitting), `AF-N` (activity feed visibility for classifier).

### Multi-specialization classification stories

**MSC-1 — Subject-matter + tool/platform mention produces two specializations**

```gherkin
As an end user
I want a request that spans a topic and a delivery platform to receive both specializations
So that the resulting plan can produce the right content and deliver it to the right place

Scenario: Meals + Notion request receives both specializations
  Given I submit "Create a summary in my Notion about the 20 most popular meals"
  And a "food & nutrition" specialization already exists
  And a "notion" specialization already exists
  When the Specialization Classifier processes my comment
  Then the comment's specializationIds includes the "food & nutrition" specialization ID
  And the comment's specializationIds includes the "notion" specialization ID
  And no third, unrelated specialization is added
```

**MSC-2 — Mixed existing + new specializations in one classification pass**

```gherkin
As the platform
I want the classifier to return existing specialization matches and a newly needed specialization together
So that a multi-domain request is never under-classified because one domain already exists in the catalog and another does not

Scenario: One existing match plus one new specialization
  Given a "legal" specialization already exists
  And no specialization exists for "airtable"
  And I submit a comment requiring both legal review and an Airtable update
  When the Specialization Classifier returns output containing a "legal" line and a "NEW:airtable|..." line
  Then the comment's specializationIds includes the existing "legal" specialization ID
  And a new "airtable" specialization is created
  And the comment's specializationIds includes the newly created "airtable" specialization ID
  And neither branch is discarded in favor of the other
```

**MSC-3 — Tool/platform recognized as its own specialization**

```gherkin
As the platform
I want a named platform mentioned in a task to be treated as a specialization candidate
So that platform-specific work is routed to a platform-aware specialization, not folded into an unrelated domain

Scenario: Slack mention creates a tool specialization
  Given no specialization exists for "slack"
  And I submit "Post today's release notes to our team Slack channel"
  When the Specialization Classifier processes my comment
  Then a new specialization named "slack" is created
  And the comment's specializationIds includes the "slack" specialization ID

Scenario: Tool specialization name aligns with MCP catalog hint
  Given the MCP catalog includes an MCP named "notion" with a short description
  And no specialization exists yet for Notion
  When the Specialization Classifier processes a comment mentioning "my Notion workspace"
  Then the classifier's context includes the MCP catalog hint for "notion"
  And the newly created specialization is named "notion", matching the MCP catalog name
```

**MSC-4 — Maximum of 5 specializations per classification pass**

```gherkin
As the platform
I want a hard cap on the number of specializations assigned per task/comment
So that classification stays bounded and plans do not fan out unmanageably

Scenario: Classifier output at the cap
  Given a comment genuinely spans 5 distinct domains
  When the Specialization Classifier returns 5 valid specialization lines/NEW entries
  Then all 5 specializations are accepted and applied to the comment

Scenario: Classifier output exceeding the cap
  Given a comment's raw classifier output contains more than 5 valid specialization lines/NEW entries
  When normalizeGeneratedSpecializations processes the output
  Then only the 5 most central specializations are retained
  And the excess entries are not applied to the comment
```

**MSC-5 — No "prefer fewer" bias**

```gherkin
As the platform
I want the classifier to assign every specialization that genuinely applies
So that legitimate multi-domain requests are not artificially narrowed to one specialization

Scenario: Two genuinely distinct domains both assigned
  Given a comment requires both "engineering" work and "finance" work with no shared platform dependency
  When the Specialization Classifier processes the comment
  Then both "engineering" and "finance" specialization IDs are returned
  And the classifier is not instructed anywhere in its rule to minimize the specialization count
```

**MSC-6 — Single-domain requests remain unaffected**

```gherkin
As an end user
I want a request that is clearly within one domain to still receive exactly one specialization
So that simple requests are not over-classified

Scenario: Single-domain request gets one specialization
  Given I submit "Draft a non-disclosure agreement for a new vendor"
  When the Specialization Classifier processes my comment
  Then exactly 1 specialization ID ("legal") is returned
```

### Multi-specialization plan splitting stories

**MSP-1 — Ordered plan items across specializations (meals + Notion)**

```gherkin
As the platform
I want cross-specialization plan items to be ordered so delivery work happens after the content it depends on
So that a Notion page is never created before the content it should contain exists

Scenario: Research step ordered before delivery step
  Given a comment has specializationIds ["food & nutrition", "notion"]
  And the "food & nutrition worker" step produces the list of 20 popular meals
  And the "notion worker" step creates a Notion page from that list
  When the Task Planner composes the plan
  Then the "food & nutrition worker" item has order 1
  And the "notion worker" item has order 2
  And the "notion worker" item's description references consuming the food & nutrition worker's output
```

**MSP-2 — Independent specializations run in parallel**

```gherkin
As the platform
I want specializations with no dependency on each other to execute in parallel
So that independent cross-domain work is not artificially serialized

Scenario: Two independent specializations share the same order
  Given a comment has specializationIds ["engineering", "finance"]
  And neither specialization's output is required as input to the other
  When the Task Planner composes the plan
  Then both the "engineering worker" and "finance worker" items have the same order value
```

**MSP-3 — Standalone tool/platform step with no dependency**

```gherkin
As the platform
I want a tool/platform step with no upstream dependency to run at order 1
So that a simple platform action is not delayed waiting for an unrelated step

Scenario: Slack-only action has no forced ordering delay
  Given a comment has specializationIds ["slack"] only
  When the Task Planner composes the plan
  Then the "slack worker" item has order 1
```

### Activity feed visibility stories

**AF-1 — Classifier invocation appears in the activity feed**

```gherkin
As an end user
I want to see the Specialization Classifier's invocation in the activity feed
So that I understand why my task was assigned particular specializations

Scenario: Classifier entry visible with full detail
  Given my comment triggers Specialization Classifier invocation
  When classification completes and I view the task detail activity feed
  Then a classifier entry appears with the agent name "Specialization classifier"
  And the entry shows the input message, the raw output, duration, and token usage (when available)
  And the entry shows the parsed outcome: matched existing specialization names and/or newly created specialization names
```

**AF-2 — Classifier entry appears even for platform-credential invocations**

```gherkin
As the platform
I want classifier invocations to be recorded regardless of credential scope
So that platform-credential system invocations are not silently excluded from the audit trail

Scenario: Platform-credential classifier call still recorded
  Given the Specialization Classifier is invoked using a platform-scoped credential
  When the invocation completes
  Then a progress event for this invocation is recorded for the comment
  And the activity feed renders the classifier entry exactly as it would for a user-credentialed invocation
```

**AF-3 — Skipped classification still visible**

```gherkin
As an end user
I want to see when classification was skipped and why
So that I understand my task proceeded without a specialization assignment

Scenario: Skipped classification shown with reason
  Given my comment's description is too short to classify
  When the Specialization Classifier tool handler returns a "skipped" result
  Then the activity feed shows a classifier entry with status "skipped"
  And the entry shows the skip reason (e.g., "short_description")
```

**AF-4 — New specialization creation surfaced inline**

```gherkin
As an end user
I want to see when my task caused a brand-new specialization to be created
So that I understand the platform is learning a new domain from my request

Scenario: New specialization name shown on the classifier entry
  Given my comment causes a new "airtable" specialization to be created
  When I view the classifier entry in the activity feed
  Then the entry indicates a new specialization "airtable" was created as an outcome of this classification
```

**AF-5 — Ordering relative to other subagent entries**

```gherkin
As an end user
I want the classifier entry to appear before the research/planning/execution entries for the same turn
So that the feed reads in the actual chronological order of what happened

Scenario: Classifier entry precedes downstream subagent entries
  Given my comment triggers classification followed by researcher, Task Planner, worker, and validator invocations
  When I view the activity feed for that comment turn
  Then the classifier entry's timestamp is earlier than the researcher entries' timestamps
  And the classifier entry renders above the researcher/Task Planner/worker/validator entries in the feed
```

---

## 8. Functional Requirements

### 8.1 Classifier parsing & output cap

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-CL-1 | `normalizeGeneratedSpecializations` (or its replacement) MUST return a **single combined result** containing both matched existing specialization IDs and new specialization name/description pairs when the raw output contains both, instead of the current either/or branch. | Unit test: raw output with 2 existing lines + 1 `NEW:` line yields a result carrying all 3; no branch is dropped. |
| FR-CL-2 | The result type is extended to represent **zero or more** existing matches **and** zero or more new specialization entries in one result shape (superseding the current `'existing' \| 'new' \| 'skipped'` exclusive union). | Type/schema change covered by unit tests for all combinations: existing-only, new-only, mixed, empty/skipped. |
| FR-CL-3 | Maximum total specializations (existing + new combined) returned per classification pass is **5** (raised from 3). | Unit test: 6 valid lines/entries → only 5 retained, deterministic selection (see FR-CL-4). |
| FR-CL-4 | When raw output exceeds the cap, the 5 **most central** entries are retained (order of appearance in the classifier's own output is treated as its ranking signal — first 5 valid entries win). | Unit test verifies deterministic truncation behavior. |
| FR-CL-5 | Multiple `NEW:` lines in a single pass are each parsed and processed independently (not limited to one new specialization per pass, as today). | Unit test: 2 `NEW:` lines both produce distinct new specializations. |
| FR-CL-6 | `resolveSpecializationIds` (or its successor in `classifyCommentSpecializations`) resolves **all** existing IDs and creates **all** new specializations from a mixed result, aggregating into one `specializationIds` array for the comment. | Integration test: mixed classify result → `taskComment.specializationIds` contains all resolved/created IDs. |

### 8.2 Classifier prompt & seed changes

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-CP-1 | The "Specialization classifier" seed rule text no longer contains any "prefer fewer specializations" instruction or equivalent minimization guidance. | Seed rule text reviewed; no minimization language present. |
| FR-CP-2 | The seed rule text is updated to instruct the classifier to identify **every genuinely applicable domain**, including named tools/platforms, up to the cap of 5. | Seed rule text includes explicit tool/platform detection guidance. |
| FR-CP-3 | The seed rule text documents the mixed-output format: existing specialization names as plain lines, new specializations as `NEW:name|description` lines, any combination allowed in the same response. | Seed rule text includes an example showing both existing and `NEW:` lines together. |
| FR-CP-4 | `MAX_SPECIALIZATION_RESULTS` (or equivalent constant) is updated from `3` to `5` and referenced consistently everywhere it is used (parser, prompt instructions, task/comment model validation if enforced there). | Single source-of-truth constant; no hardcoded "3" remaining in classifier-related code or prompts. |

### 8.3 MCP catalog hints

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-MH-1 | The message built for the Specialization Classifier invocation (`buildCatalogMessage` or successor) includes a section listing active MCP names and short descriptions, in addition to the existing specialization catalog section. | Constructed message includes an "Available tools/platforms" (or equivalent) section populated from the MCP catalog. |
| FR-MH-2 | MCP catalog hints are informational context only — they do not change which internal tools are assigned to the classifier agent (`assignedToolIds` remains `[]` per [Specialization](../specialization/prd.md) FR-SC-2). | No new tool assignment introduced for the classifier agent. |
| FR-MH-3 | When the MCP catalog is empty or unavailable, classification proceeds without the hints section rather than failing. | Unit/integration test: empty MCP catalog → classification still completes using specialization catalog only. |

### 8.4 Task/comment model cap

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-DM-1 | `task.specializationIds` and `taskComment.specializationIds` accept **up to 5** entries (raised from the prior 3-item expectation carried over from [Specialization](../specialization/prd.md) FR-DM-3). | Validation schema (if any is enforced at the model/command boundary) reflects max 5; unit test confirms a 6th ID is rejected or truncated per FR-CL-4. |

### 8.5 Task Planner plan splitting

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-TP-1 | `formatTaskPlannerPlanningSection` (or successor) includes an explicit rule: when a comment has ≥ 2 specializations and one specialization's output is a documented input to another's, the input-producing specialization's plan item(s) are ordered **before** the consuming specialization's plan item(s). | Seed/prompt text updated; reviewed against the worked example in §5.3. |
| FR-TP-2 | Specializations with no cross-dependency may share the same `order` value and execute in parallel, consistent with existing [Task Plan](../task-plan/prd.md) §4.1 parallel semantics — this PRD does not change plan execution mechanics, only the guidance the Task Planner uses to assign `order`. | No change to `domain-task-plan-instance`/`domain-task-plan-template` execution logic; only prompt guidance changes. |
| FR-TP-3 | The "one plan item per specialization worker" rule is retained unchanged — this PRD does not permit multiple plan items per specialization worker or a single item spanning multiple specialization workers. | Existing rule 3 in `formatTaskPlannerPlanningSection` preserved verbatim in intent. |

### 8.6 Activity feed visibility

| ID | Requirement | Acceptance criteria |
|----|-------------|----------------------|
| FR-AF-1 | The Specialization Classifier invocation triggered by `classifyCommentSpecializations` records a progress event for its `commentId`, regardless of the credential scope (`platform` or `user`) used for the underlying LLM call. | Progress event exists for the classifier's invocation after `classifyCommentSpecializations` runs, verified via `domain-task-progress` query for the comment. |
| FR-AF-2 | The recorded progress event includes: agent name/ID ("Specialization classifier"), input message, generated response, duration, token usage (when available), and timestamp — matching the fields already captured for other subagent invocations (per `ProgressEventModel`). | Recorded event's field set matches the shape used for researcher/Task Planner/worker/validator events. |
| FR-AF-3 | When classification is skipped, a progress event (or equivalent feed-visible record) is still created reflecting the "skipped" status and skip reason. | Skipped classification produces a visible feed entry with status "skipped" and a reason string. |
| FR-AF-4 | When classification results in one or more new specializations being created, the recorded event or its rendering surfaces the created specialization name(s) as part of the outcome. | Feed entry for a "new" or "mixed" classification outcome displays the newly created specialization name(s). |
| FR-AF-5 | `TaskActivityFeed` renders the classifier's progress event as a subagent invocation row, positioned chronologically before the researcher/Task Planner/worker/validator entries for the same comment turn. | UI renders classifier row in correct chronological position; visual style consistent with existing subagent invocation rows. |
| FR-AF-6 | This requirement applies only to the live `classifyCommentSpecializations` path; the dead `runTaskSpecializationClassification.ts` code path is not modified or required to gain visibility. | No changes required to/for the unused code path; may be left as-is or removed at the architect's discretion (see §15 OQ). |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Area | Target |
|------|--------|
| Classification step (LLM call + parsing + resolution of up to 5 specializations) | p95 < 8 s (up from the implicit single-specialization baseline, accounting for up to 5 specialization creations in the worst case) |
| MCP catalog hint construction (reading + formatting active MCP list) | p95 < 200 ms added overhead to message construction |
| Progress event write for classifier invocation | p95 < 300 ms, consistent with other progress event writes |

### 9.2 Reliability & degradation

- If MCP catalog retrieval fails or times out, classification proceeds without MCP hints rather than failing the whole classification step (mirrors existing graceful-degradation pattern for specialization classification skip conditions).
- If progress-event recording for the classifier invocation fails, classification and specialization assignment MUST still complete — activity feed visibility is additive observability, not a blocking dependency of the classification result (fire-and-log, not fire-and-fail).
- Raising the cap to 5 must not increase the blast radius of a single malformed classifier response: cap enforcement and validation remain in `normalizeGeneratedSpecializations` (or successor) regardless of how many lines the LLM returns.

### 9.3 Consistency & idempotency

- Mixed existing+new resolution must not create duplicate specializations: each `NEW:` entry still goes through the existing idempotent `create-specialization` tool (case-insensitive name lookup before creation), unchanged from [Specialization](../specialization/prd.md) FR-IT-3.
- Re-running classification for an already-classified comment continues to be skipped entirely (existing `comment.specializationIds` non-empty check in `classifyCommentSpecializations`), unchanged by this PRD.

### 9.4 Security

- MCP catalog hints injected into the classifier prompt include only name and description fields already exposed via the existing MCP catalog query — no credentials, connection strings, or MCP configuration secrets are included in the prompt.
- No new externally-callable surface is introduced; classification remains invoked only from the internal `classifyCommentSpecializations` service handler.

### 9.5 Accessibility

- The classifier's activity feed row follows the same accessibility pattern as existing subagent invocation rows (keyboard-operable expand/collapse, appropriate `aria-label`s for status), per [Task Comment Conversation](../task-comment-conversation/prd.md) accessibility conventions.

### 9.6 Platform

- No new domain packages. Changes are confined to: `services/agent/src/internalTools/classifySpecialization/` (parser, message builder), `domains/system-agent/seed/systemAgents.json` (classifier rule text), `services/task/src/handlers/classifyCommentSpecializations/` (resolution + progress-event wiring), `domains/system-agent/src/utils/buildSystemAgentSystemMessage/formatTaskPlannerPlanningSection.ts` (plan ordering guidance), and `apps/web/app/tasks/[id]/_components/TaskActivityFeed/` (rendering).
- No changes to `domains/task-plan-template` / `domains/task-plan-instance` execution mechanics (only prompt guidance consumed by the Task Planner changes).

---

## 10. Edge Cases & Error Handling

| Case | Expected behavior |
|------|--------------------|
| Classifier output contains only `NEW:` lines, no existing matches, and the description also clearly matches an existing specialization by keyword (but the LLM didn't name it) | No special-cased keyword fallback — the platform trusts the LLM's own output; only the entries the LLM actually returns are processed (existing behavior unchanged) |
| Classifier returns more than 5 valid entries | Only the first 5 valid entries (in output order) are retained; remaining entries are discarded silently (logged as informational, not an error) |
| Classifier returns 2+ `NEW:` lines for what is effectively the same domain worded differently (e.g., "notion" and "notion-workspace") | No automatic de-duplication beyond exact case-insensitive name match at `create-specialization` time; two similarly-named specializations may be created — acceptable in Phase 1, same trade-off as existing single-specialization creation (see [Specialization](../specialization/prd.md) Edge Cases) |
| A mentioned tool/platform has no corresponding MCP in the catalog at all | Tool/platform specialization is still created (MCP hints are advisory, not a gating requirement); no MCP is mapped to it until/unless the MCP catalog later gains a matching entry and the MCP Specialization Classifier flow runs |
| Task/comment already has 5 specializationIds and a follow-up comment's classification would add more | The 5-item cap applies **per comment's own classification result**, not cumulatively enforced across the whole task's aggregated `task.specializationIds`; task-level aggregation (`aggregateTaskSpecializationIds`) may exceed 5 in total distinct specializations across a long-running task's multiple comments — this is expected and not capped at the task level, only at the per-classification-pass level |
| MCP catalog is empty (no MCPs configured) | Classification proceeds without a tool/platform hints section; tool/platform detection still works from the task description itself, without catalog-name alignment |
| Classifier invocation fails outright (LLM/provider error) | Classification is skipped exactly as today (existing skip/error handling in `classifySpecializationToolHandler`/`classifyCommentSpecializations`'s try/catch); the activity feed still records a "failed" entry for the classifier invocation (per FR-AF-1/FR-AF-2) so the failure is visible, not silent |
| Cross-specialization ordering: a subject-matter specialization's output is needed by **two** different tool/platform specializations (e.g., meals summary needed for both Notion and Slack) | Both tool/platform items share `order` 2 (parallel), both depending on the single order-1 research item, consistent with §5.2 |
| A comment triggers classification but is later retried/resumed per [Pause, Resume, and Retry Task](../pause-resume-task/prd.md) | Existing idempotency check (`comment.specializationIds` non-empty → skip) prevents re-classification on retry; the original classifier activity feed entry remains visible from the first attempt |

---

## 11. Out of Scope

| Item | Notes |
|------|-------|
| Classification quality/accuracy observability metric | Explicitly deferred per D-6; no new metric, dashboard, or sampling mechanism ships in this PRD |
| Worker/researcher/validator agent provisioning changes | Provisioning of the 3-agent set per specialization (per [Specialization](../specialization/prd.md) `create-specialization`) is unchanged; raising the cap to 5 does not change how agent sets are created |
| Automatic de-duplication of near-duplicate specialization names | e.g., "notion" vs. "notion-workspace" — no fuzzy-matching or merge tooling introduced |
| MCP Specialization Classifier feed visibility | Not required by this PRD (see §6.4); may be considered separately |
| Dead code path `runTaskSpecializationClassification.ts` | Not invoked by the live flow; not modified or removed as part of this PRD |
| Task Plan execution mechanics changes (retry, failure propagation, null-`skillId` backfill) | Fully covered by [Task Plan](../task-plan/prd.md); unaffected by this PRD beyond the ordering **guidance** in §5.2/§8.5 |
| Admin UI changes for the Specializations catalog pages | No new UI beyond the existing read-only specialization list/detail pages from [Specialization](../specialization/prd.md); this PRD's UI change is limited to the task activity feed |
| Raising the cap beyond 5 or making the cap configurable | Cap is a fixed constant of 5 for this PRD; configurability is not requested |
| Historical backfill of classifier activity feed entries for past comments | Only new classifications going forward gain feed visibility; no backfill of historical progress events for previously classified comments |

---

## 12. Supersedes / Conflicts

| Prior decision | Status | Resolution in this PRD |
|-----------------|--------|--------------------------|
| [Specialization](../specialization/prd.md) SP-2 — "at most 3 specialization IDs... prefer fewer specializations" | **Superseded** | Cap raised to 5; "prefer fewer" instruction removed entirely (D-3, D-4) |
| [Specialization](../specialization/prd.md) §8.3 `normalizeGeneratedSpecializations` — "Return `{ type: 'existing', ... }` **or** `{ type: 'new', ... }`" (exclusive union) | **Superseded** | Result shape changed to support both branches simultaneously (D-2, FR-CL-1/FR-CL-2) |
| [Specialization](../specialization/prd.md) §6.5 seed rule text ("Prefer fewer specializations. Return only specialization names... If a new specialization is needed, prefix the line with NEW:") | **Superseded** | Seed rule text updated per §8.2 (FR-CP-1–FR-CP-4); mixed-output format documented explicitly |
| [Task Skill Planning](../task-skill-planning/prd.md) TP-5 / FR-TP-9 — Task Planner composes plans "from multiple skills" per specialization, one item per specialization worker | **Extended, not superseded** | Ordering guidance added (§5, FR-TP-1) for the case where ≥ 2 specialization items have a producer/consumer relationship; the one-item-per-worker rule itself is unchanged |
| Implicit behavior in `classifySpecializationToolHandler` — platform-credential invocations skip `recordAgentInvokeProgress` | **Superseded for this invocation** | This PRD requires the classifier's progress event to be recorded regardless of credential scope (D-7, FR-AF-1); this does not change the general `credentialScope === 'platform' → skip progress` behavior for other platform-credential invocations elsewhere in the codebase, only for the Specialization Classifier's invocation specifically (left to architecture to determine the least invasive way to achieve this — see §15 OQ) |

---

## 13. Dependencies

| Dependency | Status | Impact if missing |
|------------|--------|---------------------|
| `domains/specialization` (`create`, `getList`) | Exists | Cannot look up existing specialization catalog or create new ones |
| `domains/system-agent` (`getActiveByName`, seed for "Specialization classifier") | Exists | Cannot invoke the classifier agent or update its rule text |
| `domains/task-comment` (`setSpecializationIds`, `getModelById`) | Exists | Cannot persist multi-specialization results per comment |
| `services/task` `classifyCommentSpecializations`, `aggregateTaskSpecializationIds` | Exists | No entry point to trigger classification or roll results up to the task |
| `services/agent` `classifySpecializationToolHandler`, `normalizeGeneratedSpecializations`, `runAgentInvokeWithTools` | Exists | Classification, parsing, and LLM invocation have no implementation to extend |
| `domains/mcp` (`getList` or equivalent catalog query) | Exists | Cannot build MCP catalog hints for classifier context |
| `domains/task-progress` (`recordProgressEvent`, `initializeTaskProgress`) | Exists | Cannot record classifier invocation for activity feed visibility |
| `services/task/src/handlers/executeTask/recordProgressHelper.ts` / `createRecordAgentInvokeProgress.ts` pattern | Exists | No established pattern to reuse for wiring the classifier's progress recording |
| `apps/web` `TaskActivityFeed` (subagent invocation row components, e.g. `ActivityMcpInvocationRow`) | Exists | No existing row component pattern to reuse for the classifier's feed entry |
| [Task Skill Planning](../task-skill-planning/prd.md) Task Planner + `formatTaskPlannerPlanningSection` | Exists (shipped) | No planning-section prompt to extend with ordering guidance |
| [Task Plan](../task-plan/prd.md) template/instance persistence + parallel/ordered execution | Exists (shipped) | Ordering guidance would have no execution semantics to map onto |

---

## 14. Acceptance Criteria (QA Checklist)

### Classification correctness

- [ ] A prompt naming both a subject-matter domain and a tool/platform (meals + Notion) yields 2 specialization IDs on the comment (MSC-1)
- [ ] A classification pass with both existing-specialization lines and a `NEW:` line yields all of them combined, not one branch (MSC-2, FR-CL-1/FR-CL-2)
- [ ] Two `NEW:` lines in one pass both create distinct specializations (FR-CL-5)
- [ ] A prompt naming an uncataloged tool creates a new tool/platform specialization (MSC-3)
- [ ] A prompt naming a tool matching an existing MCP catalog entry names the new specialization consistently with the MCP name (MSC-3, FR-MH-1)
- [ ] Classification output is capped at 5 total specializations; excess entries are dropped deterministically (MSC-4, FR-CL-3/FR-CL-4)
- [ ] Seed rule text contains no "prefer fewer" language (MSC-5, FR-CP-1)
- [ ] A clearly single-domain prompt still yields exactly 1 specialization (MSC-6)

### Plan splitting

- [ ] Meals + Notion example produces order-1 "food & nutrition worker" and order-2 "notion worker" items (MSP-1)
- [ ] Two independent specializations share the same order and execute in parallel per existing Task Plan semantics (MSP-2)
- [ ] A standalone tool/platform specialization with no dependency is order 1 (MSP-3)
- [ ] "One plan item per specialization worker" rule is unchanged (FR-TP-3)

### Activity feed visibility

- [ ] Classifier invocation appears in the activity feed with input, output, duration, and token usage (AF-1, FR-AF-1/FR-AF-2)
- [ ] Classifier entry appears even though the invocation uses a platform-scoped credential (AF-2, FR-AF-1)
- [ ] Skipped classification still renders a feed entry with the skip reason (AF-3, FR-AF-3)
- [ ] New specialization creation is surfaced inline on the classifier's feed entry (AF-4, FR-AF-4)
- [ ] Classifier entry is positioned chronologically before researcher/Task Planner/worker/validator entries for the same turn (AF-5, FR-AF-5)
- [ ] Failed classifier invocations render a "failed" feed entry rather than disappearing silently

### Regression

- [ ] Single-specialization classification (existing behavior) continues to work unchanged for single-domain prompts
- [ ] `create-specialization` idempotency (case-insensitive name match) still holds when multiple new specializations are created in one pass
- [ ] Already-classified comments are still skipped on retry/resume (no re-classification)
- [ ] Existing `TaskActivityFeed` rendering for researchers/Task Planner/workers/validators is unaffected by the new classifier row
- [ ] MCP catalog admin UI and MCP Specialization Classifier flow (mapping MCPs to new specializations) are unaffected

---

## 15. Open Questions

### 15.1 Deferred to Architect

| # | Question | Context |
|---|----------|---------|
| **OQ-1** | Mechanism for recording the classifier's progress event without altering the general `credentialScope === 'platform' → skip progress` behavior elsewhere | `runAgentInvokeWithTools` currently derives `recordProgress` from `toolContext.recordAgentInvokeProgress` unless `credentialScope === 'platform'`. Needs an architectural decision: special-case the classifier call, change the platform-credential skip condition to be opt-in per caller, or thread an explicit "always record" flag through `classifyCommentSpecializations`'s `toolContext`. |
| **OQ-2** | Selection strategy when classifier output exceeds the 5-item cap | FR-CL-4 assumes "first 5 valid entries in output order" is an acceptable deterministic rule; confirm this is sufficient or whether a more deliberate ranking (e.g., re-prompting, confidence signal) is warranted. |
| **OQ-3** | Detecting a producer/consumer relationship between specializations for ordering (§5.2) | This PRD specifies the *desired outcome* (research/content before delivery/persist) but leaves the *mechanism* (LLM judgment via updated prompt text vs. an explicit dependency field on plan items) to architecture. |
| **OQ-4** | Whether the MCP Specialization Classifier should also gain activity feed visibility | Explicitly out of scope per §6.4, but flagged for a follow-up decision since it shares the same underlying "platform-credential invocations are invisible" root cause. |
| **OQ-5** | Exact result-type migration path for `ClassifySpecializationResult` | FR-CL-2 requires changing the current `'existing' | 'new' | 'skipped'` exclusive union to a combined shape; architecture should confirm the new shape and its impact on `classifyCommentSpecializations`'s `resolveSpecializationIds` and any other consumers of the current type. |
| **OQ-6** | Whether `MAX_SPECIALIZATION_RESULTS` should be promoted to a shared constant (e.g., `packages/constants`) now that it is referenced by both the parser and the seed prompt text, to avoid drift between the two. | Currently a local constant in `normalizeGeneratedSpecializations.ts`; raising to 5 is a good opportunity to centralize it. |

---

*End of PRD — ready for architecture review.*
