# Product Requirements Document: Real-Time Agent Execution Progress Tracker

**Document status:** Draft for engineering, design, and QA handoff  
**Last updated:** 2026-06-15  
**Feature slug:** `real-time-execution-progress`  
**Related docs:** [Async LLM Task Execution](../async-llm-task-execution/prd.md) · [Task Detail Page](../task-detail-page/prd.md) · [AI Integrations](../ai-integrations/prd.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Overview](#2-feature-overview)
3. [User Stories & Acceptance Criteria](#3-user-stories--acceptance-criteria)
4. [Scope Definition](#4-scope-definition)
5. [UI/UX Specifications](#5-uiux-specifications)
6. [Data Model & Storage](#6-data-model--storage)
7. [Use Cases (Gherkin)](#7-use-cases-gherkin)
8. [Edge Cases & Error Handling (Gherkin)](#8-edge-cases--error-handling-gherkin)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Acceptance Criteria for QA](#10-acceptance-criteria-for-qa)
11. [Constraints & Dependencies](#11-constraints--dependencies)
12. [Future Extensibility](#12-future-extensibility)

---

## 1. Executive Summary

### 1.1 Problem

Users creating tasks and monitoring agent execution currently see **no intermediate feedback** during the execution lifecycle. The Task Detail Page displays a final result only after completion, leaving users uncertain about execution progress, where failures occur, or token consumption. Debugging requires digging into logs. This opacity creates friction for task creators, limits operational visibility for developers/QA, and reduces confidence in system reliability.

### 1.2 Solution

A **Real-Time Agent Execution Progress Tracker** displays step-by-step execution events as hierarchical logs during task execution. Each agent/step in the workflow logs state changes (`started`, `completed`, `failed`) with timestamps, durations, token usage, and error details. A new **taskProgress** data entity (separate from the task record) stores all progress events. A UI panel on the Task Detail Page shows a scrollable progress list with contextual modals for input/output/error inspection, polling the API at regular intervals for live updates.

### 1.3 Value Proposition

| User Role | Benefit |
|-----------|---------|
| **Task Creator** | Real-time confirmation that work is progressing; immediate visibility into failures |
| **Task Viewer** | Understand execution flow without digging into logs; quick inspection of generated content |
| **Developer/QA** | Debugging visibility; token usage transparency for cost monitoring |
| **Product/Ops** | Performance metrics (step duration, error rates, token efficiency) for capacity planning |

### 1.4 Success Metrics

| Metric | Target (MVP) | Measurement |
|--------|--------------|-------------|
| Polling latency | ≤ 1s (API response time, p95) | Backend request/response timing |
| Progress update frequency | 100+ events per task execution | Event count in database |
| Token visibility | 100% of completed steps show input/output/total token counts | UI inspection + data validation |
| Error clarity | 100% of failed steps expose user-readable error messages | QA + UI verification |
| Data persistence | 100% of progress logs persist after page refresh | UI + database validation |
| Initial display time | Progress panel loads ≤ 2s after page load | FCP + first API response |

---

## 2. Feature Overview

### 2.1 What Is It?

A real-time execution transparency layer that captures and visualizes agent execution events in a chronological, hierarchical format. Users see agent names, timestamps (relative to task start), durations, token usage, and error details as a structured log.

### 2.2 Where Does It Live?

- **Context**: Task Detail Page (`/tasks/[id]`)
- **UI Element**: New "Execution Progress" panel below task description
- **API**: Polling endpoint for task progress data
- **Data**: Separate `taskProgress` collection (MongoDB or equivalent)

### 2.3 Display Format

```
@Assistant started 6 seconds ago
@Intent classifier started 5 seconds ago
@Intent classifier completed 5 seconds ago (took 4.9s)
@Question worker started 3 seconds ago
@Question worker completed 3 seconds ago (took 2.1s)
@Assistant Completed in 4.9s 1 second ago
```

Each line represents one event. Users can click to expand and see input/output/error details in a modal.

---

## 3. User Stories & Acceptance Criteria

### 3.1 User Story: Task Creator Monitors Live Progress

**As a** task creator who just submitted a task,  
**I want to** see real-time updates on the Execution Progress panel as agents start and complete work,  
**So that** I can confirm the system is working and see results as soon as they're available.

**Acceptance Criteria:**

- [ ] When a task is in `in-progress` status, the Execution Progress panel appears on the Task Detail Page
- [ ] Progress events are fetched via polling at 1-second intervals (configurable)
- [ ] New events appear in the list without requiring a page refresh
- [ ] Event timestamps are relative to now (e.g., "6 seconds ago")
- [ ] Panel updates continue until task status changes to `done` or `failed`
- [ ] No polling occurs when status is `created`, `done`, or `failed` (optimization)

---

### 3.2 User Story: Developer Inspects Agent Execution Details

**As a** developer or QA tester,  
**I want to** click on any progress event and see the input messages, generated output, and token usage in a modal,  
**So that** I can debug agent behavior and verify correct execution without accessing logs directly.

**Acceptance Criteria:**

- [ ] Each progress event is clickable (visual affordance: hover state, cursor: pointer)
- [ ] Clicking a `started` event opens a modal showing input messages as formatted text
- [ ] Clicking a `completed` event opens a modal showing generated response and token counts
- [ ] Clicking a `failed` event opens a modal showing error message and stack trace (if available)
- [ ] Modal displays a close button (X) and/or overlay click-to-close
- [ ] Modal text is selectable (copy-paste enabled)
- [ ] Token counts display as: "Tokens: 150 input + 245 output = 395 total"

---

### 3.3 User Story: User Reviews Execution History After Completion

**As a** user returning to a completed task,  
**I want to** see the full execution progress history even after page refresh,  
**So that** I can review how the task was executed without losing context.

**Acceptance Criteria:**

- [ ] All progress events persist in the database after task completion
- [ ] Progress panel displays the same events on page refresh (no polling, just static display)
- [ ] Polling stops automatically when task status is `done` or `failed`
- [ ] Completed tasks show execution time in the task metadata (e.g., "Executed in 12.3s")

---

### 3.4 User Story: Operator Monitors System Performance

**As a** system operator or product manager,  
**I want to** see cumulative token usage across all steps and average step duration,  
**So that** I can track resource consumption and identify performance bottlenecks.

**Acceptance Criteria:**

- [ ] Task Detail Page footer shows aggregate metrics: total tokens, total execution time, step count
- [ ] Metrics are calculated from stored progress data and updated on page load
- [ ] Token usage is broken down by step (visible in expanded modals)

---

### 3.5 User Story: Developer Debugs Failures Quickly

**As a** developer investigating a failed task,  
**I want to** see which agent/step failed and what error occurred in a clear, readable format,  
**So that** I can triage and fix issues faster than searching logs.

**Acceptance Criteria:**

- [ ] Failed events display a red error indicator (visual distinction)
- [ ] Error event modal shows the error message and (optionally) error type and stack trace
- [ ] Error details are human-readable (not raw JSON dumps, unless necessary)
- [ ] Non-failed preceding steps remain visible for context

---

## 4. Scope Definition

### 4.1 In Scope (MVP)

- Real-time polling API endpoint: `GET /api/tasks/{taskId}/progress`
- Data model: `taskProgress` entity with event array
- Event types: `started`, `completed`, `failed`
- Event metadata: `agentName`, `timestamp`, `duration`, `tokenUsage`, `errorDetails`, `inputMessages`, `generatedResponse`
- UI panel: Execution Progress list with relative timestamps and line-by-line display
- Click-to-expand modals: input, output, error details
- Polling interval: 1 second (user-configurable in future)
- Polling stops: When task status is `done` or `failed`
- Persistence: All progress data persists after page refresh and task completion
- Data retrieval: GraphQL query for progress events (read-only)

### 4.2 Out of Scope (Future Phases)

- Nested subagent call visualization (hierarchical tree view)
- Real-time WebSocket streaming (MVP uses polling)
- Live log tail/filtering (MVP shows complete list)
- Agent retry visualization (simple failed state only)
- Performance flame graphs or trace visualization
- Integration with external observability platforms (Datadog, Sentry, etc.)
- Progress export (CSV, JSON download)
- Custom step metadata or user-defined fields

### 4.3 Deferred Design Decisions

- **Polling frequency**: MVP hardcoded to 1s; make configurable in future
- **Nested agents**: Foundation laid in data model; visual hierarchy deferred
- **Partial task abort**: Not supported; task runs to completion or failure

---

## 5. UI/UX Specifications

### 5.1 Progress Panel Layout

```
┌─ Execution Progress (Live) ──────────────────────────┐
│                                                        │
│ @Assistant started 6 seconds ago                      │
│ @Intent classifier started 5 seconds ago              │
│ @Intent classifier completed 5 seconds ago (took 4.9s)│
│ @Question worker started 3 seconds ago                │
│ @Question worker completed 3 seconds ago (took 2.1s)  │
│ @Assistant Completed in 4.9s 1 second ago             │
│                                                        │
│ ─── Aggregate Metrics ───────────────────────────────│
│ Total Execution Time: 12.3s                           │
│ Total Tokens: 1,240 (645 in + 595 out)               │
│ Steps Completed: 6                                    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Panel Behavior:**

- **Position**: Below task description on Task Detail Page
- **Height**: Scrollable list container (max 400px suggested)
- **Refresh**: Updates in place without full refresh
- **Status Badge**: "Live" or "Completed" indicator showing polling status
- **Empty State**: "Waiting for execution to start..." (when task is created but not in-progress)

### 5.2 Event Line Format

**Anatomy:**

```
@{agentName} {state} {relativeTimestamp} [{duration or error}]
```

**Examples:**

- `@Assistant started 6 seconds ago`
- `@Intent classifier completed 5 seconds ago (took 4.9s)`
- `@Question worker failed 2 seconds ago (ERROR: Timeout)`
- `@Assistant Completed in 12.3s 1 second ago`

**Styling:**

- `started` → gray text, regular font
- `completed` → green text or checkmark icon, normal font
- `failed` → red text, bold or alert icon
- Timestamps → lighter gray, monospace font
- Duration → parentheses, monospace
- Agent names → bold or @-prefix for visual scanning

### 5.3 Interaction: Click to Expand

Clicking any event opens a context modal with:

**For `started` event:**
- Title: "Agent Started: {agentName}"
- Content: Input messages as formatted JSON or text block
- Close button

**For `completed` event:**
- Title: "Agent Completed: {agentName}"
- Tabs or sections:
  - Input (if available)
  - Output (generated response, formatted)
  - Token Usage: "Input: 150 | Output: 245 | Total: 395"
- Copy button for output
- Close button

**For `failed` event:**
- Title: "Agent Failed: {agentName}"
- Content:
  - Error Message (human-readable)
  - Error Type (e.g., TimeoutError, ValidationError)
  - Stack Trace (if available, in collapsible section)
- Retry button (if applicable, deferred to future phase)
- Close button

### 5.4 Visual States

| State | Indicator | Styling |
|-------|-----------|---------|
| **In Progress** | Animated spinner or pulsing dot | Gray, animated |
| **Completed** | Checkmark or static tick | Green (#4CAF50 or equivalent) |
| **Failed** | Error icon (⚠) or X | Red (#F44336 or equivalent) |
| **Hover** | Subtle background highlight | Opacity: 0.1 background |
| **Active/Clicked** | Highlight row | Opacity: 0.15 background, cursor: pointer |

---

## 6. Data Model & Storage

### 6.1 TaskProgress Entity

**Collection:** `taskProgress` (MongoDB or equivalent)  
**One document per task** (not per event)

```typescript
interface TaskProgress {
  _id: ObjectId;
  taskId: string; // FK to Task
  userId: string; // Owner (for auth/filtering)
  createdAt: Date; // Task creation time
  startedAt: Date; // First event timestamp
  completedAt: Date; // Last event timestamp (or null if in-progress)
  events: ProgressEvent[];
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
  totalDuration: number; // milliseconds
  status: 'in-progress' | 'completed' | 'failed'; // mirrors Task.status
}

interface ProgressEvent {
  _id: ObjectId;
  agentName: string; // e.g., "Assistant", "Intent classifier", "Question worker"
  state: 'started' | 'completed' | 'failed';
  timestamp: Date; // ISO timestamp
  duration?: number; // milliseconds (only for completed/failed)
  inputMessages?: string; // Serialized input (JSON or text)
  generatedResponse?: string; // Agent output (raw response text)
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  errorDetails?: {
    message: string; // User-readable error message
    type?: string; // e.g., "TimeoutError", "ValidationError"
    stackTrace?: string; // Optional, for debugging
  };
  parentAgentId?: string; // For nested agents (future phase)
  childAgentIds?: string[]; // For nested agents (future phase)
}
```

### 6.2 Data Capture Points

Progress events are logged by the backend service that orchestrates agent execution:

1. **Event: Agent Started**
   - Triggered when agent begins execution
   - Captures: `agentName`, `timestamp`, `inputMessages`

2. **Event: Agent Completed**
   - Triggered when agent finishes successfully
   - Captures: `agentName`, `timestamp`, `duration`, `generatedResponse`, `tokenUsage`

3. **Event: Agent Failed**
   - Triggered when agent encounters an error
   - Captures: `agentName`, `timestamp`, `duration`, `errorDetails`

4. **Event: Task Completed**
   - Final event; aggregates metrics
   - Captures: `totalDuration`, `totalTokens`, `status: 'completed'`

5. **Event: Task Failed**
   - Final event on error
   - Captures: `totalDuration`, `totalTokens`, `status: 'failed'`

### 6.3 Storage Strategy

- **Indexing**: Create index on `(taskId, userId)` for fast lookups during polling
- **TTL (optional)**: Set MongoDB TTL of 90 days on `completedAt` for automatic cleanup
- **Atomicity**: Use atomic updates (push to `events` array) to avoid race conditions during polling
- **Query pattern**: Retrieve entire `taskProgress` document once per poll (not individual events)

---

## 7. Use Cases (Gherkin)

### 7.1 Primary Use Case: Real-Time Progress Monitoring

```gherkin
Scenario: Task creator monitors live execution progress
Given a user has just submitted a task via the create task form
And the task status is "in-progress"
When the user navigates to or remains on the Task Detail Page
Then the Execution Progress panel appears with "Live" status indicator
And the first progress event displays within 1 second
And new events are appended to the list as agents execute
And timestamps show relative time (e.g., "6 seconds ago")
And polling continues until task status changes to "done" or "failed"
And no page refresh is required to see new events
```

### 7.2 Use Case: Inspection of Execution Details

```gherkin
Scenario: Developer clicks on a completed event to inspect output
Given a task is displaying execution progress
And an event with state "completed" is visible in the list
When the user clicks on the completed event
Then a modal opens showing:
  - Agent name
  - Generated response (full text, formatted)
  - Token counts (input, output, total)
  - Duration of execution
And the modal content is selectable (copy-paste enabled)
And clicking the close button or overlay dismisses the modal
```

### 7.3 Use Case: Error Inspection

```gherkin
Scenario: Developer inspects a failed event to understand the error
Given a task contains a failed progress event
And the event state is "failed"
When the user clicks on the failed event
Then a modal opens showing:
  - Agent name
  - Error message (human-readable, e.g., "Request timed out after 30s")
  - Error type (if available, e.g., "TimeoutError")
  - Stack trace (in a collapsible section, if available)
And the preceding (successful) events remain visible for context
And clicking the close button dismisses the modal
```

### 7.4 Use Case: Persistence After Completion

```gherkin
Scenario: User refreshes page and sees complete execution history
Given a task has finished executing (status "done" or "failed")
And all progress events are persisted in the database
When the user refreshes the Task Detail Page
Then the Execution Progress panel displays the same events
And timestamps now show relative time from page load (recalculated)
And polling no longer occurs (optimization: task is complete)
And total execution time is displayed in task metadata
```

### 7.5 Use Case: Empty State Handling

```gherkin
Scenario: Task creator sees progress panel while task is being created
Given a user has just submitted a task
And the task has been persisted but execution has not yet started
And the task status is "created" (not yet "in-progress")
When the user views the Task Detail Page
Then the Execution Progress panel displays:
  - "Waiting for execution to start..."
  - No polling occurs until status changes to "in-progress"
And the panel remains visible but inactive
```

---

## 8. Edge Cases & Error Handling (Gherkin)

### 8.1 Edge Case: Polling Fails

```gherkin
Scenario: API returns error during polling
Given polling is active and a new event is expected
When the GET /api/tasks/{taskId}/progress request fails (500, timeout, etc.)
Then the UI displays a non-blocking warning (toast or inline alert):
  - "Unable to fetch latest updates. Retrying..."
And polling continues automatically at the next interval
And previously fetched events remain visible (no state loss)
And the warning dismisses on successful retry
```

### 8.2 Edge Case: Task Transitions to Failed Mid-Display

```gherkin
Scenario: Task fails after some events have started
Given the Execution Progress panel shows several "completed" events
And the next agent encounters an error
When a "failed" event is appended to the progress list
Then the event is displayed with red styling and an error icon
And polling stops after the "failed" event is fetched
And the error details modal can be opened to inspect the failure reason
And task status is updated to "failed" in the task metadata
```

### 8.3 Edge Case: No Events Generated

```gherkin
Scenario: Task execution produces no progress events
Given a task has been submitted and status is "in-progress"
And no agents have logged events (infrastructure error or race condition)
When polling returns an empty events array after a reasonable wait (e.g., 30s)
Then the UI displays an alert:
  - "Task is running but no progress data available. Check logs."
And polling continues or times out after a max duration (e.g., 5 minutes)
```

### 8.4 Edge Case: User Navigates Away During Polling

```gherkin
Scenario: User leaves Task Detail Page during live polling
Given polling is active and the task is in-progress
When the user navigates away from the Task Detail Page
Then polling stops immediately (cleanup on component unmount)
And no further API calls are made for this task
And no memory leaks occur from orphaned timers or subscriptions
```

### 8.5 Edge Case: Modal Opens While Polling

```gherkin
Scenario: User opens modal to inspect event while new events are being fetched
Given a modal is open displaying event details
And a new progress event arrives from polling
When the new event is appended to the progress list
Then the modal remains open (no interruption)
And the list updates behind the modal (user sees on close)
And the list scroll position is preserved
```

### 8.6 Edge Case: Very Long Agent Names or Outputs

```gherkin
Scenario: Agent name or output text is very long
Given an event with a long agent name (>50 characters)
Or an event with very long generated response (>10KB)
When the event is displayed in the list or modal
Then the agent name is truncated with ellipsis in the list view:
  - "@Assistant Integration with Tool..." (60 char max)
And the full name is shown in the modal or on hover (tooltip)
And the generated response is fully displayed in the modal
And the modal content is scrollable if it exceeds viewport height
```

### 8.7 Edge Case: Token Usage is Missing

```gherkin
Scenario: Progress event has no token usage data
Given an event has state "completed"
But the tokenUsage object is null or undefined
When the event modal opens
Then the UI displays:
  - "Token usage unavailable"
  And does not break the display or show "NaN" values
```

### 8.8 Edge Case: Task Deleted While Viewing Progress

```gherkin
Scenario: Task is deleted by another user or admin while progress panel is open
Given polling is active and the task is in-progress
When the next polling request returns a 404 (task not found)
Then the UI displays an error message:
  - "This task no longer exists."
And polling stops
And a link to "Return to Task List" is provided
```

### 8.9 Edge Case: Page Loaded Without Task ID

```gherkin
Scenario: User opens Task Detail Page with invalid or missing task ID
Given the URL is /tasks/[id] but id is malformed or nonexistent
When the page loads and the GraphQL query for the task fails
Then the Execution Progress panel is not rendered
And the page shows a 404 or error message
And no polling is initiated
```

### 8.10 Edge Case: Timestamp Skew or Out-of-Order Events

```gherkin
Scenario: Progress events arrive out of chronological order
Given the database or API returns events in non-sequential order
When the progress list is rendered
Then events are sorted by timestamp (ascending) before display
And the relative timestamps are recalculated based on sorted order
And the list always shows chronological progression (no visual confusion)
```

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| API response time (p95) | ≤ 500ms | Quick polling without blocking UI |
| Initial page load (FCP) | ≤ 2s (including first progress fetch) | User perceived performance |
| Polling latency | ≤ 1s | Real-time feel without excessive load |
| UI render time (delta) | ≤ 50ms | Smooth appending of new events |
| Memory per task (progress data) | ≤ 100KB (typical) | No memory leaks; ~10KB per 100 events |
| Max events per task | 1,000 (soft limit) | Truncate/archive older events if exceeded |

### 9.2 Accessibility (a11y)

- **Keyboard Navigation**: All interactive elements (event rows, modals, buttons) are focusable with Tab
- **Screen Reader Support**:
  - Event state (`started`, `completed`, `failed`) announced as ARIA live region updates
  - Modals announce title and role (`role="dialog"`)
  - Agent names and timestamps are descriptive (not abbreviated)
- **Color Contrast**: Event indicators (green, red, gray) meet WCAG AA standards (4.5:1 ratio)
- **Focus Management**: Modal focus trap; focus returns to triggering event on close
- **Relative Time**: Announced as accessible text (e.g., "started 6 seconds ago"), not just visual

### 9.3 Platform Specifics

- **Web (Primary)**: Responsive design; works on desktop, tablet, mobile
- **Responsive Breakpoints**:
  - Desktop (≥1024px): Full panel, side-by-side layout
  - Tablet (768–1023px): Full-width panel, stacked layout
  - Mobile (<768px): Full-width, scrollable progress list
- **Mobile Optimizations**:
  - Touch-friendly event rows (min 48px height)
  - Modal optimized for smaller screens
  - Polling interval increases on mobile (battery/data concerns) — future phase

### 9.4 Persistence & State Management

- **Session Persistence**: All progress data persists across page reloads within a session
- **Authentication**: Only task owner can view progress data (via API auth)
- **Data Retention**: Progress records retained for 90 days (configurable TTL)
- **Sync Strategy**: Polling pulls latest state from database; no local caching beyond render
- **Error State Recovery**: If polling fails, UI shows previously fetched data (stale) until connectivity recovers

### 9.5 Compatibility

- **Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Next.js**: Minimum version TBD (already in use in project)
- **React**: Minimum version TBD (already in use)
- **GraphQL Client**: Apollo Client or equivalent (check project setup)

---

## 10. Acceptance Criteria for QA

### 10.1 Functional Verification

- [ ] Progress panel is not rendered when task status is `created`
- [ ] Progress panel is rendered and polling begins when task status changes to `in-progress`
- [ ] API endpoint `/api/tasks/{taskId}/progress` returns correct taskProgress object structure
- [ ] Progress events are fetched at approximately 1-second intervals (within ±100ms tolerance)
- [ ] Polling stops when task status is `done` or `failed` (no unnecessary API calls)
- [ ] All event states (`started`, `completed`, `failed`) are displayed with correct styling
- [ ] Clicking an event opens the appropriate modal (input for started, output for completed, error for failed)
- [ ] Modal close button (X) and overlay click both dismiss the modal
- [ ] Relative timestamps update correctly after page refresh (e.g., "6 seconds ago" → "10 seconds ago" if 4s passed)
- [ ] Aggregate metrics (total execution time, token count) are calculated correctly
- [ ] Agent names, timestamps, and durations are formatted consistently

### 10.2 Data Persistence Verification

- [ ] After task completion, refreshing the page displays all progress events
- [ ] Progress events are stored in the `taskProgress` collection with all required fields
- [ ] Token counts are accurate and match backend calculations
- [ ] Error messages are human-readable and helpful for debugging

### 10.3 Edge Case Verification

- [ ] If polling fails, an error toast appears and polling retries automatically
- [ ] If no events are returned after 30 seconds, a "no progress" alert is shown
- [ ] If user navigates away, polling stops and no orphaned requests remain
- [ ] If task is deleted, polling returns 404 and UI displays "task no longer exists"
- [ ] Very long agent names are truncated in the list and fully displayed in the modal
- [ ] Very long outputs are scrollable in the modal without breaking layout
- [ ] Out-of-order events (by timestamp) are sorted before display

### 10.4 Performance Verification

- [ ] API response time is consistently ≤ 500ms under normal load
- [ ] Progress panel initial render is ≤ 2s (FCP metric)
- [ ] New events append to the list without full page re-render
- [ ] No memory leaks detected after 10 minutes of polling (DevTools heap snapshot)
- [ ] Modal opens and closes smoothly (no jank, 60 FPS target)

### 10.5 Accessibility Verification

- [ ] All event rows are keyboard-focusable (Tab navigation)
- [ ] Modal has focus trap (Tab cycles within modal)
- [ ] Focus is returned to triggering event after modal closes
- [ ] Event state changes are announced by screen reader (ARIA live region)
- [ ] Modal title and content are readable by screen reader
- [ ] Color contrast ratios meet WCAG AA (4.5:1) for text

### 10.6 Responsive Design Verification

- [ ] Progress panel is readable on desktop (≥1024px)
- [ ] Progress panel is readable on tablet (768–1023px)
- [ ] Progress panel is readable on mobile (<768px); event rows are at least 48px tall
- [ ] Modal is usable on all screen sizes
- [ ] Text is not clipped or overflowed on smaller screens

### 10.7 Regression Testing

- [ ] Task Detail Page functionality (existing features) is not affected
- [ ] Task list navigation to detail page still works
- [ ] Back button navigation from detail page still works
- [ ] Other UI elements (task metadata, description) render correctly alongside progress panel
- [ ] Existing tests for Task Detail Page still pass

---

## 11. Constraints & Dependencies

### 11.1 Technical Dependencies

| Dependency | Constraint | Rationale |
|------------|-----------|-----------|
| Backend task execution service | Must log events to `taskProgress` collection | Core data requirement |
| MongoDB (or database) | `taskProgress` collection must exist and be indexed | Data persistence layer |
| GraphQL API | New query `taskProgress(taskId: ID!)` must be implemented | Data retrieval for UI |
| REST API | `/api/tasks/{taskId}/progress` endpoint must exist | Polling endpoint |
| Next.js routing | Page `/tasks/[id]` must exist | UI rendering context |
| Apollo Client (or GraphQL client) | Must support queries for progress data | Frontend data fetching |

### 11.2 Architectural Constraints

- **Polling (not WebSocket)**: MVP uses HTTP polling for simplicity; WebSocket deferred to future
- **Single task progress record**: One document per task (not per event) for simpler queries
- **No nested agents in MVP**: Progress events are flat; hierarchy support deferred
- **Synchronous UI updates**: Events are fetched and displayed synchronously; streaming deferred

### 11.3 Data Consistency Constraints

- **Event atomicity**: Events must be appended atomically to avoid race conditions during concurrent polling
- **Timestamp ordering**: Events must be sortable by timestamp; backend must ensure correct clock synchronization
- **Token accuracy**: Token counts must be validated against provider API responses (or fallback to 0)

### 11.4 Scope Boundaries

- **No real-time collaboration**: If multiple users view the same task, they all poll independently (no shared live session)
- **No event filtering**: MVP shows all events; filtering/search deferred to future
- **No event export**: Progress data is view-only in MVP; export deferred
- **No custom metrics**: Only standard fields (agentName, state, timestamp, duration, tokens, error); custom metadata deferred

---

## 12. Future Extensibility

### 12.1 Nested Agent Visualization

**Current foundation:**
- `parentAgentId` and `childAgentIds` fields in ProgressEvent schema
- Flat event list ready for hierarchical expansion

**Future implementation:**
- Tree view or indented list showing parent-child relationships
- Collapsible parent events to hide/show children
- Visual nesting with indent and connector lines

**Example:**
```
@Assistant started 6 seconds ago
  ├─ @Intent classifier started 5 seconds ago
  │  └─ (completed 5 seconds ago)
  ├─ @Question worker started 3 seconds ago
  │  └─ (completed 3 seconds ago)
@Assistant completed 1 second ago
```

### 12.2 Advanced Filtering & Search

**Future capabilities:**
- Filter by agent name, state, or error type
- Search event messages or outputs
- Toggle display of completed vs. failed vs. in-progress events
- Time range filtering (show last 30 seconds, last 5 minutes, all)

### 12.3 Real-Time WebSocket Streaming

**Current polling limitation:**
- 1-second polling latency; inefficient for high-frequency events

**Future optimization:**
- Replace polling with WebSocket subscription
- Bidirectional connection for real-time push updates
- Fallback to polling if WebSocket unavailable

### 12.4 Retry & Resume Logic

**Future enhancement:**
- If a task fails, show "Retry" button on failed event
- Re-execute from failed step or from beginning
- Display retry attempt count and history

### 12.5 Performance Flame Graphs

**Future analytics:**
- Visualize step duration as horizontal bars or flame graph
- Identify bottleneck agents
- Compare duration across multiple task runs

### 12.6 Integration with External Observability

**Future expansion:**
- Export progress data to Datadog, Sentry, or equivalent
- Correlate progress events with external traces
- Link to external observability dashboards from progress panel

### 12.7 Progress Event Archival

**Future optimization:**
- If task has >1,000 events, archive older events to separate collection
- Lazy-load archived events on demand
- Configurable archival threshold

### 12.8 Custom Metadata & Dimensions

**Future enhancement:**
- Allow agents to log custom fields (e.g., model name, LLM provider, retry count)
- Display custom fields in progress modal
- Filter/group by custom dimensions

---

## Appendix A: Data Flow Diagram

```
Task Created (API POST /tasks)
         │
         ↓
Task Status → "in-progress"
         │
         ↓
Backend logs ProgressEvent.started
         │
         ↓
Agent executes (LLM API call, processing, etc.)
         │
         ↓
Backend logs ProgressEvent.completed (or failed)
         │
         ↓
Store ProgressEvent in taskProgress.events[]
         │
         ↓
Frontend polls GET /api/tasks/{taskId}/progress (every ~1s)
         │
         ↓
UI renders new events in real-time
         │
         ↓
Task completes (Task status → "done" or "failed")
         │
         ↓
Frontend stops polling
         │
         ↓
On page refresh, taskProgress data persists and displays as static history
```

---

## Appendix B: Sample API Response

```json
{
  "taskId": "task-12345",
  "status": "in-progress",
  "startedAt": "2026-06-15T14:00:00Z",
  "events": [
    {
      "_id": "event-001",
      "agentName": "Assistant",
      "state": "started",
      "timestamp": "2026-06-15T14:00:00Z",
      "inputMessages": "Analyze the following query: What is 2+2?"
    },
    {
      "_id": "event-002",
      "agentName": "Intent classifier",
      "state": "started",
      "timestamp": "2026-06-15T14:00:01Z",
      "inputMessages": "Classify: What is 2+2?"
    },
    {
      "_id": "event-003",
      "agentName": "Intent classifier",
      "state": "completed",
      "timestamp": "2026-06-15T14:00:01.050Z",
      "duration": 50,
      "generatedResponse": "Intent: MATH_QUESTION",
      "tokenUsage": {
        "input": 12,
        "output": 5,
        "total": 17
      }
    },
    {
      "_id": "event-004",
      "agentName": "Question worker",
      "state": "started",
      "timestamp": "2026-06-15T14:00:02Z",
      "inputMessages": "Answer: What is 2+2?"
    },
    {
      "_id": "event-005",
      "agentName": "Question worker",
      "state": "completed",
      "timestamp": "2026-06-15T14:00:04.100Z",
      "duration": 2100,
      "generatedResponse": "The answer is 4.",
      "tokenUsage": {
        "input": 28,
        "output": 15,
        "total": 43
      }
    },
    {
      "_id": "event-006",
      "agentName": "Assistant",
      "state": "completed",
      "timestamp": "2026-06-15T14:00:04.200Z",
      "duration": 4200,
      "generatedResponse": "The answer is 4. 2+2 equals 4.",
      "tokenUsage": {
        "input": 150,
        "output": 85,
        "total": 235
      }
    }
  ],
  "totalTokens": {
    "input": 190,
    "output": 105,
    "total": 295
  },
  "totalDuration": 4200
}
```

---

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| **Progress Event** | A single log entry capturing an agent's state change (started, completed, or failed) at a specific timestamp |
| **TaskProgress** | A database entity storing all progress events for a single task |
| **Polling** | Repeated HTTP requests at regular intervals (every ~1s) to fetch new progress data |
| **Relative Timestamp** | Time shown relative to "now" (e.g., "6 seconds ago") rather than absolute (e.g., "2026-06-15T14:00:00Z") |
| **Token Usage** | Count of input, output, and total tokens consumed by an LLM API call |
| **Agent Name** | Human-readable identifier for a step in the execution pipeline (e.g., "Intent classifier", "Question worker") |
| **Modal** | Overlay dialog for detailed inspection of a single progress event |

---

**End of Document**

