# Real-Time Execution Progress Tracker — Implementation Reference

**Quick Reference for Engineers, Designers, and QA**

---

## User Stories (with Acceptance Criteria)

### US-1: Real-Time Progress Monitoring
**As a** task creator  
**I want to** see live execution progress updates without page refresh  
**So that** I can confirm work is progressing and see results immediately

**Acceptance Criteria:**
- Progress panel appears when task status is `in-progress`
- API polls at 1-second intervals
- New events appear without refresh
- Timestamps are relative ("6 seconds ago")
- Polling stops when status changes to `done` or `failed`

**Priority:** P0 (MVP)

---

### US-2: Inspect Execution Details
**As a** developer  
**I want to** click any progress event and see input/output/error details in a modal  
**So that** I can debug execution without accessing logs

**Acceptance Criteria:**
- Each event is clickable
- Started event modal shows input messages
- Completed event modal shows output + token counts
- Failed event modal shows error message, type, and trace
- Modal text is selectable
- Modal closes on X button or overlay click

**Priority:** P0 (MVP)

---

### US-3: Persistent Execution History
**As a** user returning to a completed task  
**I want to** see the full execution history even after page refresh  
**So that** I can review execution without losing context

**Acceptance Criteria:**
- All events persist after task completion
- History displays on page refresh (no polling, static display)
- Task metadata shows total execution time
- Polling stops automatically on task completion

**Priority:** P0 (MVP)

---

### US-4: System Performance Monitoring
**As a** system operator  
**I want to** see total token usage and execution time  
**So that** I can track resource consumption

**Acceptance Criteria:**
- Task detail footer shows: total execution time, total tokens, step count
- Token usage is broken down by step in modals
- Metrics calculated from stored progress data

**Priority:** P1 (Phase 2)

---

### US-5: Quick Failure Diagnosis
**As a** developer investigating a failed task  
**I want to** see which step failed and what the error was  
**So that** I can triage issues quickly

**Acceptance Criteria:**
- Failed events display red error indicator
- Error modal shows human-readable message
- Error type and stack trace available (optional)
- Non-failed preceding steps remain visible for context

**Priority:** P0 (MVP)

---

## Detailed Acceptance Criteria Checklist (QA)

### Functional Verification
- [ ] Progress panel hidden when task status is `created`
- [ ] Progress panel shown and polling begins when status → `in-progress`
- [ ] API endpoint `/api/tasks/{taskId}/progress` returns correct structure
- [ ] Polling frequency ~1 second (±100ms tolerance)
- [ ] Polling stops when status → `done` or `failed`
- [ ] Started events: gray text, regular font
- [ ] Completed events: green checkmark, normal font
- [ ] Failed events: red alert icon, bold text
- [ ] Click event → correct modal opens
- [ ] Modal close (X) and overlay click both work
- [ ] Relative timestamps recalculate on page refresh
- [ ] Aggregate metrics calculated correctly
- [ ] Agent names, timestamps, durations formatted consistently

### Data Persistence
- [ ] taskProgress collection stores all events
- [ ] All required fields present in stored events
- [ ] Token counts accurate and match backend calculations
- [ ] Error messages are human-readable
- [ ] Page refresh displays same events (no loss)

### Edge Cases
- [ ] Polling failure → error toast + auto-retry
- [ ] No events after 30s → "no progress" alert
- [ ] User navigates away → polling stops, no orphaned requests
- [ ] Task deleted → 404 handled, "task no longer exists" message
- [ ] Long agent names → truncated in list, full in modal
- [ ] Long outputs → scrollable in modal
- [ ] Events out-of-order → sorted by timestamp before display
- [ ] Missing token usage → "unavailable" message (no NaN)

### Performance
- [ ] API response ≤ 500ms (p95)
- [ ] Initial panel render ≤ 2s
- [ ] Events append without full page re-render
- [ ] No memory leaks after 10 min polling
- [ ] Modal opens/closes smoothly (60 FPS)

### Accessibility
- [ ] All event rows keyboard-focusable
- [ ] Modal focus trap active
- [ ] Focus returns to event after modal close
- [ ] Event state changes announced (ARIA live region)
- [ ] Modal content readable by screen reader
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)

### Responsive Design
- [ ] Desktop (≥1024px): full panel readable
- [ ] Tablet (768–1023px): full-width, stacked layout
- [ ] Mobile (<768px): scrollable, event rows ≥48px
- [ ] Modal usable on all sizes
- [ ] No text clipping

### Regression
- [ ] Task Detail Page existing features unaffected
- [ ] Task list navigation still works
- [ ] Back button still works
- [ ] Other UI elements render correctly with progress panel
- [ ] Existing tests pass

---

## Gherkin Scenarios (for E2E/BDD Testing)

### Core Scenarios

#### Scenario: Task Creator Monitors Live Execution
```gherkin
Feature: Real-Time Execution Progress Monitoring

Scenario: Task creator sees live progress as agents execute
  Given a user has just submitted a task
  And the task status has transitioned to "in-progress"
  When the user views the Task Detail Page
  Then the Execution Progress panel appears with "Live" indicator
  And the first progress event displays within 1 second
  And new events are appended to the list as they occur
  And each event shows: agent name, state, relative timestamp
  And no page refresh is required to see updates
  And polling continues until task status changes to "done" or "failed"
```

#### Scenario: Developer Inspects Completed Event Details
```gherkin
Scenario: Developer opens modal to inspect completed event
  Given the Task Detail Page displays execution progress
  And a progress event with state "completed" is visible
  When the user clicks on the completed event
  Then a modal opens showing:
    - Agent name
    - Generated response (full text)
    - Token counts: Input | Output | Total
    - Duration of execution
  And the response text is selectable (copy-paste enabled)
  And clicking the X button closes the modal
  And clicking outside the modal (overlay) closes it
```

#### Scenario: Developer Inspects Failed Event Error Details
```gherkin
Scenario: Developer opens modal to understand failure
  Given the Task Detail Page displays progress
  And a progress event with state "failed" is visible
  When the user clicks on the failed event
  Then a modal opens showing:
    - Agent name
    - Error message (human-readable)
    - Error type (if available)
    - Stack trace (in collapsible section)
  And preceding successful events remain visible for context
  And clicking X or overlay closes the modal
```

#### Scenario: User Refreshes Page and Sees Persistent History
```gherkin
Scenario: Execution history persists after page refresh
  Given a task has completed (status "done" or "failed")
  And all progress events are stored in the database
  When the user refreshes the Task Detail Page
  Then the Execution Progress panel displays the same events
  And timestamps are recalculated (relative to current time)
  And polling no longer occurs (optimization)
  And total execution time displays in task metadata
```

#### Scenario: Progress Panel Shows Placeholder When Task Not Started
```gherkin
Scenario: Empty state when task execution has not begun
  Given a user has submitted a task
  And the task status is "created" (not yet "in-progress")
  When the user views the Task Detail Page
  Then the Execution Progress panel displays:
    - "Waiting for execution to start..."
  And no polling occurs
  And the panel remains inactive until status changes
```

---

### Edge Case Scenarios

#### Scenario: Polling Fails and Retries
```gherkin
Scenario: API error during polling is handled gracefully
  Given polling is active
  And the next GET /api/tasks/{taskId}/progress request fails (500, timeout)
  When the error occurs
  Then a non-blocking warning appears:
    - "Unable to fetch latest updates. Retrying..."
  And polling continues at the next interval
  And previously fetched events remain visible
  And the warning dismisses on successful retry
```

#### Scenario: Task Fails Mid-Execution
```gherkin
Scenario: Failed event appears in list and polling stops
  Given several completed events are displayed
  And the next agent encounters an error
  When a "failed" event is appended
  Then the event displays with red styling and error icon
  And polling stops after the failed event is fetched
  And the error details modal can be opened
  And task status updates to "failed"
```

#### Scenario: No Progress Events Generated (Infrastructure Error)
```gherkin
Scenario: Task runs but generates no events
  Given a task status is "in-progress"
  And polling has been active for 30+ seconds
  But no events are returned
  When this condition persists
  Then an alert displays:
    - "Task is running but no progress data available. Check logs."
  And polling continues or times out after 5 minutes
```

#### Scenario: User Navigates Away During Polling
```gherkin
Scenario: Polling stops when user leaves page
  Given polling is active
  And the task is in-progress
  When the user navigates to a different page
  Then polling stops immediately
  And no further API calls are made
  And no memory leaks occur
```

#### Scenario: Modal Remains Open While List Updates
```gherkin
Scenario: Modal not interrupted by new events
  Given a modal is open displaying event details
  And a new progress event arrives from polling
  When the new event is appended to the list
  Then the modal remains open
  And the list updates behind the modal
  And scroll position is preserved
  And user can close modal and see updated list
```

#### Scenario: Long Agent Names Truncated in List
```gherkin
Scenario: Very long agent names handled gracefully
  Given an event with agent name >50 characters
  When the event displays in the progress list
  Then the name is truncated with ellipsis (60 char max):
    - "@Long Agent Name With Tool..." 
  And the full name displays in the modal or on hover
  And layout does not break
```

#### Scenario: Large Text Output Scrollable in Modal
```gherkin
Scenario: Very long generated response
  Given a completed event with response >10KB
  When the event modal opens
  Then the full response is displayed
  And the modal content is scrollable
  And layout does not break
  And text remains selectable
```

#### Scenario: Missing Token Usage Handled
```gherkin
Scenario: Token usage unavailable for event
  Given a completed event without tokenUsage data
  When the event modal opens
  Then the UI displays:
    - "Token usage unavailable"
  And the display does not show "NaN" or break layout
```

#### Scenario: Task Deleted While Viewing Progress
```gherkin
Scenario: Task deleted by admin during viewing
  Given polling is active
  When the next polling request returns 404 (task not found)
  Then an error message displays:
    - "This task no longer exists."
  And polling stops
  And a link to "Return to Task List" is provided
```

#### Scenario: Events Arrive Out-of-Order
```gherkin
Scenario: Out-of-chronological-order events sorted correctly
  Given the API returns events in non-sequential order
  When the progress list is rendered
  Then events are sorted by timestamp (ascending)
  And relative timestamps are recalculated correctly
  And the list always shows proper chronological progression
```

---

## API Specification Quick Reference

### Endpoint: GET /api/tasks/{taskId}/progress

**Request:**
```
GET /api/tasks/{taskId}/progress
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "taskId": "task-12345",
  "status": "in-progress",
  "startedAt": "2026-06-15T14:00:00Z",
  "completedAt": null,
  "events": [
    {
      "_id": "event-001",
      "agentName": "Assistant",
      "state": "started",
      "timestamp": "2026-06-15T14:00:00Z",
      "inputMessages": "..."
    },
    {
      "_id": "event-002",
      "agentName": "Intent classifier",
      "state": "completed",
      "timestamp": "2026-06-15T14:00:01.050Z",
      "duration": 50,
      "generatedResponse": "...",
      "tokenUsage": {
        "input": 12,
        "output": 5,
        "total": 17
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

**Error Responses:**
- **404**: Task not found or unauthorized
- **500**: Server error

---

## Data Model Quick Reference

**Collection:** `taskProgress`

```typescript
interface TaskProgress {
  _id: ObjectId;
  taskId: string;              // FK to Task
  userId: string;              // Owner
  createdAt: Date;             // Task creation time
  startedAt: Date;             // First event
  completedAt: Date | null;    // Last event (null if in-progress)
  events: ProgressEvent[];
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
  totalDuration: number;       // milliseconds
  status: 'in-progress' | 'completed' | 'failed';
}

interface ProgressEvent {
  _id: ObjectId;
  agentName: string;
  state: 'started' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number;           // milliseconds (completed/failed only)
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  errorDetails?: {
    message: string;
    type?: string;
    stackTrace?: string;
  };
  parentAgentId?: string;      // Future: nested agents
  childAgentIds?: string[];    // Future: nested agents
}
```

**Indexes:**
- `(taskId, userId)` — for polling queries
- TTL on `completedAt` (90 days) — auto-cleanup

---

## UI Component Structure (Suggested)

```
TaskDetailPage
├── TaskHeader
├── TaskDescription
├── ExecutionProgressPanel
│   ├── ProgressHeader (Live/Completed indicator)
│   ├── ProgressEventList
│   │   └── ProgressEventRow (clickable)
│   │       └── ProgressEventModal (on click)
│   │           ├── InputSection (for started)
│   │           ├── OutputSection (for completed)
│   │           └── ErrorSection (for failed)
│   └── AggregateMetrics
│       ├── TotalExecutionTime
│       ├── TotalTokenCount
│       └── StepCount
└── TaskMetadata
```

---

## Priority & Phasing

**MVP (Phase 1) — P0 Stories:**
- US-1: Real-time progress monitoring
- US-2: Inspect execution details
- US-3: Persistent execution history
- US-5: Quick failure diagnosis

**Phase 2 — P1 Stories:**
- US-4: System performance monitoring (aggregate metrics)

**Future Phases — P2+:**
- Nested agent visualization
- WebSocket real-time streaming
- Advanced filtering & search
- Retry/resume logic
- Performance flame graphs
- External observability integration

---

**For full context, see:** `/docs/features/real-time-execution-progress/prd.md`
