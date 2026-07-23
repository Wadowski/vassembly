# Architecture Implementation Plan: Real-Time Agent Execution Progress Tracker

**Document status:** Engineering handoff  
**Last updated:** 2026-06-15  
**Feature slug:** `real-time-execution-progress`  
**Related docs:** [PRD](./prd.md) · [Design](./design.md)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Structures & Types](#2-data-structures--types)
3. [Backend Requirements](#3-backend-requirements)
4. [Frontend Requirements](#4-frontend-requirements)
5. [Integration Points](#5-integration-points)
6. [API Contracts](#6-api-contracts)
7. [Detailed Task Breakdown](#7-detailed-task-breakdown)
8. [Technical Considerations](#8-technical-considerations)
9. [Monorepo Integration](#9-monorepo-integration)
10. [Design Patterns & Conventions](#10-design-patterns--conventions)
11. [Implementation Checklist](#11-implementation-checklist)
12. [Post-Implementation Fixes](#12-post-implementation-fixes)
13. [Multi-Agent Progress & Status Simplification](#13-multi-agent-progress--status-simplification)

---

## 1. Architecture Overview

### 1.1 System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Agent Execution Lifecycle                        │
└─────────────────────────────────────────────────────────────────────┘

1. User submits task
   ↓
2. Task status → "in-progress"
   ↓
3. Backend orchestrator begins agent execution
   │
   ├─ Agent 1 starts
   │  └─ Record ProgressEvent.started
   │
   ├─ Agent 1 executes (LLM call, processing)
   │
   ├─ Agent 1 completes/fails
   │  └─ Record ProgressEvent.completed/failed with duration, tokens, output
   │
   ├─ [More agents...]
   │
   └─ Final: Task status → "done" or "failed"
      └─ Record completion metrics

4. All ProgressEvents stored atomically in taskProgress.events[]
   ↓
5. Frontend polls: GET /api/tasks/{taskId}/progress (every ~1s)
   ├─ Query: taskProgress(taskId: ID!)
   ├─ Response: Complete taskProgress document with updated events array
   └─ Client renders new events in real-time
   ↓
6. Polling stops when task.status ∈ ["done", "failed"]
   ↓
7. On page refresh: taskProgress persists, displays as static history

┌─────────────────────────────────────────────────────────────────────┐
│                     Database & API Layer                             │
└─────────────────────────────────────────────────────────────────────┘

MongoDB Collections:
  - tasks (existing) — Task model with status field
  - taskProgress (new) — Progress tracking for each task

API Endpoints:
  - GraphQL Query: taskProgress(taskId: ID!) → TaskProgress DTO
  - REST: GET /api/tasks/{taskId}/progress → TaskProgress JSON

Auth:
  - JWT / session token required
  - User can only access their own task progress (userId scope)
  - Verified in middleware before handler execution

┌─────────────────────────────────────────────────────────────────────┐
│                     Component Hierarchy (UI)                         │
└─────────────────────────────────────────────────────────────────────┘

TaskDetailPage
  ├─ ExecutionProgressTracker (new container)
  │  ├─ ProgressList
  │  │  ├─ ProgressItem (for each event)
  │  │  │  ├─ StatusIcon
  │  │  │  ├─ AgentName + Duration
  │  │  │  └─ TokenUsageWidget (inline)
  │  │  └─ EmptyState / LoadingState / ErrorState
  │  │
  │  └─ ProgressDetailModal
  │     ├─ Header (close button, agent name, status badge)
  │     ├─ Metadata section (status, duration, timestamps)
  │     ├─ TokenUsageWidget (expanded)
  │     ├─ Request section (formatted JSON)
  │     ├─ Response section (formatted JSON)
  │     ├─ EventsTimeline section (Phase 2)
  │     └─ Footer (close button)
```

### 1.2 Key Design Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| **One doc per task** (not per event) | Simpler indexing; atomic appends; easier pagination | Slightly higher write frequency to single doc |
| **Polling (not WebSocket)** | Simpler deployment; standard HTTP; works everywhere | ~1s latency vs real-time; Phase 2 can upgrade |
| **Flat event list (Phase 1)** | MVP scope; foundation for nested hierarchy in Phase 2 | Cannot visualize parent-child relationships initially |
| **No truncation in frontend** | Full transparency for debugging; scrollable modals | May impact performance with 1000s of events (Phase 2: virtual scroll) |
| **GraphQL for reads** | Follows workspace convention; query flexibility | Slightly more complex schema vs REST |
| **Atomic array appends** | Prevents race conditions during concurrent polling | Requires MongoDB `$push` operator; max BSON doc size ~16MB |

---

## 2. Data Structures & Types

### 2.1 MongoDB TaskProgress Schema

**Collection:** `taskProgress`  
**Purpose:** Store all execution progress events for a single task

```typescript
/**
 * Complete TaskProgress document (one per task)
 * Stored in MongoDB `taskProgress` collection
 */
interface TaskProgress {
  _id: ObjectId;           // Auto-generated by MongoDB
  taskId: string;          // Foreign key to Task._id
  userId: string;          // Task owner (for auth/filtering)
  
  // Metadata
  createdAt: Date;         // When taskProgress was created (= Task.startedAt)
  startedAt: Date;         // Timestamp of first event
  completedAt: Date | null; // Timestamp of last event (null if in-progress)
  status: 'in-progress' | 'completed' | 'failed'; // Mirrors Task.status
  
  // Events array
  events: ProgressEvent[]; // All execution events (max ~1000 in MVP)
  
  // Aggregated metrics
  totalDuration: number;   // Milliseconds from first to last event
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
}

/**
 * Individual progress event within TaskProgress.events[]
 */
interface ProgressEvent {
  _id: ObjectId;           // Unique within array; used for event identification
  
  // Core metadata
  agentName: string;       // e.g., "Assistant", "Intent classifier"
  state: 'started' | 'completed' | 'failed';
  timestamp: Date;         // ISO timestamp of event
  
  // Execution details (populated on completion)
  duration?: number;       // Milliseconds (only for completed/failed)
  inputMessages?: string;  // Serialized input (JSON string or plain text)
  generatedResponse?: string; // Agent output/response text
  
  // Token tracking
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
  
  // Error details (only for failed state)
  errorDetails?: {
    message: string;       // User-readable error message
    type?: string;         // e.g., "TimeoutError", "ValidationError"
    stackTrace?: string;   // Optional stack trace for debugging
  };
  
  // Future: nested agent support (Phase 2)
  parentAgentId?: string;  // For hierarchical events
  childAgentIds?: string[]; // References to child events
}
```

### 2.2 TypeScript Interfaces (Frontend & Backend Shared Types)

**Location:** `domains/task-progress/src/model/types.ts` (backend domain)  
**Export to frontend:** Via `@vassembly/ui-api-hooks` or direct DTO mapping

```typescript
// ============= Domain Types (Backend) =============

export interface TaskProgressModel {
  id: string;
  taskId: string;
  userId: string;
  createdAt: Date;
  startedAt: Date;
  completedAt: Date | null;
  status: 'in-progress' | 'completed' | 'failed';
  events: ProgressEventModel[];
  totalDuration: number; // ms
  totalTokens: TokenUsage;
}

export interface ProgressEventModel {
  id: string;
  agentName: string;
  state: 'started' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number; // ms
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
  parentAgentId?: string;
  childAgentIds?: string[];
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface ErrorDetails {
  message: string;
  type?: string;
  stackTrace?: string;
}

// ============= DTO Types (Returned to Frontend) =============

export interface TaskProgressResponse {
  id: string;
  taskId: string;
  status: 'in-progress' | 'completed' | 'failed';
  startedAt: string;     // ISO 8601
  completedAt: string | null; // ISO 8601
  events: ProgressEventResponse[];
  totalDuration: number; // ms
  totalTokens: TokenUsage;
}

export interface ProgressEventResponse {
  id: string;
  agentName: string;
  state: 'started' | 'completed' | 'failed';
  timestamp: string;     // ISO 8601
  duration?: number;     // ms
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
}

// ============= Frontend Component Types =============

export interface ProgressTrackerState {
  items: ProgressEventResponse[];
  isLoading: boolean;
  error?: Error;
  lastFetchedAt: Date;
}

export interface ProgressItemProps {
  event: ProgressEventResponse;
  onSelect: (eventId: string) => void;
  isSelected: boolean;
}

export interface ProgressDetailModalProps {
  event: ProgressEventResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

// ============= Command/Query Input Types =============

export interface RecordProgressEventInput {
  taskId: string;
  agentName: string;
  state: 'started' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
}

export interface GetTaskProgressInput {
  taskId: string;
  userId: string; // For auth validation
}
```

### 2.3 Sample MongoDB Document

```json
{
  "_id": { "$oid": "6671a4f3c2b1d5e8f0a9c1d2" },
  "taskId": "task-12345",
  "userId": "user-auth-123",
  "createdAt": { "$date": "2026-06-15T14:00:00.000Z" },
  "startedAt": { "$date": "2026-06-15T14:00:00.100Z" },
  "completedAt": { "$date": "2026-06-15T14:00:12.500Z" },
  "status": "completed",
  "events": [
    {
      "_id": { "$oid": "6671a4f3c2b1d5e8f0a9c1d3" },
      "agentName": "Assistant",
      "state": "started",
      "timestamp": { "$date": "2026-06-15T14:00:00.100Z" },
      "inputMessages": "{\"prompt\": \"Analyze sales data\", \"model\": \"gpt-4\"}"
    },
    {
      "_id": { "$oid": "6671a4f3c2b1d5e8f0a9c1d4" },
      "agentName": "Intent classifier",
      "state": "started",
      "timestamp": { "$date": "2026-06-15T14:00:01.200Z" },
      "inputMessages": "{\"text\": \"Classify: Analyze sales data\"}"
    },
    {
      "_id": { "$oid": "6671a4f3c2b1d5e8f0a9c1d5" },
      "agentName": "Intent classifier",
      "state": "completed",
      "timestamp": { "$date": "2026-06-15T14:00:01.350Z" },
      "duration": 150,
      "generatedResponse": "Intent: ANALYSIS",
      "tokenUsage": {
        "input": 25,
        "output": 12,
        "total": 37
      }
    },
    {
      "_id": { "$oid": "6671a4f3c2b1d5e8f0a9c1d6" },
      "agentName": "Data analyzer",
      "state": "started",
      "timestamp": { "$date": "2026-06-15T14:00:02.400Z" },
      "inputMessages": "{\"data\": [...], \"analysis_type\": \"summary\"}"
    },
    {
      "_id": { "$oid": "6671a4f3c2b1d5e8f0a9c1d7" },
      "agentName": "Data analyzer",
      "state": "completed",
      "timestamp": { "$date": "2026-06-15T14:00:11.200Z" },
      "duration": 8800,
      "generatedResponse": "Sales increased 23% YoY. Top product: Widget X.",
      "tokenUsage": {
        "input": 1240,
        "output": 580,
        "total": 1820
      }
    },
    {
      "_id": { "$oid": "6671a4f3c2b1d5e8f0a9c1d8" },
      "agentName": "Assistant",
      "state": "completed",
      "timestamp": { "$date": "2026-06-15T14:00:12.500Z" },
      "duration": 12400,
      "generatedResponse": "Complete sales analysis report generated.",
      "tokenUsage": {
        "input": 1280,
        "output": 650,
        "total": 1930
      }
    }
  ],
  "totalDuration": 12400,
  "totalTokens": {
    "input": 2545,
    "output": 1242,
    "total": 3787
  }
}
```

---

## 3. Backend Requirements

### 3.1 New Domain: @vassembly/domain-task-progress

**Purpose:** Encapsulate task progress entity, persistence, and queries

**Structure:**
```
domains/task-progress/
├── src/
│   ├── index.ts
│   ├── model/
│   │   ├── model.ts              # TaskProgressModel class
│   │   ├── dto.ts                # TaskProgressResponse DTO
│   │   ├── factories.ts          # Factory helpers
│   │   ├── toTaskProgressResponse.ts
│   │   └── graphql.ts            # GraphQL schema
│   ├── commands/
│   │   ├── index.ts
│   │   ├── recordProgressEvent/  # Add event to taskProgress.events[]
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   └── index.test.ts
│   │   ├── initializeTaskProgress/  # Create new taskProgress doc
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   └── index.test.ts
│   │   └── finalizeTaskProgress/  # Mark as completed/failed + aggregate metrics
│   │       ├── index.ts
│   │       ├── types.ts
│   │       └── index.test.ts
│   ├── queries/
│   │   ├── index.ts
│   │   ├── getTaskProgressByTaskId/  # Fetch full taskProgress (public, returns DTO)
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   └── index.test.ts
│   │   └── getModelByTaskId/  # Internal (returns Model)
│   │       └── index.ts
│   ├── clients/
│   │   ├── mongodb.ts          # MongoDB DAO
│   │   └── index.ts
│   └── types/
│       └── index.ts             # Shared type definitions
├── package.json
├── README.md
└── vitest.config.ts
```

### 3.2 New Service Handler: @vassembly/service-task → handlers/recordTaskProgress

**Purpose:** Service-layer orchestration for recording progress events during task execution

**Location:** `services/task/src/handlers/recordTaskProgress/`

```typescript
// types.ts
export interface RecordTaskProgressInput {
  taskId: string;
  userId: string;
  agentName: string;
  state: 'started' | 'completed' | 'failed';
  timestamp?: Date;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
}

export interface RecordTaskProgressOutput {
  taskProgressId: string;
  eventId: string;
  status: 'in-progress' | 'completed' | 'failed';
}

// index.ts
export const recordTaskProgress = async (
  input: RecordTaskProgressInput
): Promise<RecordTaskProgressOutput> => {
  // 1. Validate task belongs to user
  const task = await taskDomain.queries.getModelById({ id: input.taskId });
  if (task.userId !== input.userId) {
    throw new ForbiddenError('Unauthorized');
  }

  // 2. Create taskProgress doc if not exists (initialize on first event)
  let taskProgress = await taskProgressDomain.queries.getModelByTaskId({
    taskId: input.taskId,
  });
  
  if (!taskProgress) {
    taskProgress = await taskProgressDomain.commands.initializeTaskProgress({
      taskId: input.taskId,
      userId: input.userId,
    });
  }

  // 3. Record the progress event
  const event = await taskProgressDomain.commands.recordProgressEvent({
    taskId: input.taskId,
    agentName: input.agentName,
    state: input.state,
    timestamp: input.timestamp || new Date(),
    duration: input.duration,
    inputMessages: input.inputMessages,
    generatedResponse: input.generatedResponse,
    tokenUsage: input.tokenUsage,
    errorDetails: input.errorDetails,
  });

  // 4. If task completed/failed, finalize progress document
  if (input.state === 'failed' || task.status === 'done') {
    await taskProgressDomain.commands.finalizeTaskProgress({
      taskId: input.taskId,
    });
  }

  return {
    taskProgressId: taskProgress.id,
    eventId: event.id,
    status: input.state,
  };
};
```

### 3.3 GraphQL Query Endpoint

**Location:** API Gateway (`apps/api/src/graphql/`)

**Query Schema:**
```graphql
extend type Query {
  """
  Fetch task progress tracking data (execution events, token usage, timestamps)
  for a given task. Returns complete progress document with all events.
  
  Requires authentication. User can only access their own task progress.
  """
  taskProgress(taskId: ID!): TaskProgress
}

"""
Complete task progress tracking document
"""
type TaskProgress {
  id: ID!
  taskId: ID!
  
  """Execution status: in-progress, completed, or failed"""
  status: TaskProgressStatus!
  
  """When task execution began"""
  startedAt: DateTime!
  
  """When task execution ended (null if in-progress)"""
  completedAt: DateTime
  
  """All progress events in chronological order"""
  events: [ProgressEvent!]!
  
  """Total execution time in milliseconds"""
  totalDuration: Int!
  
  """Aggregated token usage across all events"""
  totalTokens: TokenUsage!
}

enum TaskProgressStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
}

"""
Individual execution event (agent start/complete/fail)
"""
type ProgressEvent {
  id: ID!
  
  """Agent name (e.g., 'Assistant', 'Intent classifier')"""
  agentName: String!
  
  """Event state: started, completed, or failed"""
  state: ProgressEventState!
  
  """When event occurred (ISO 8601)"""
  timestamp: DateTime!
  
  """How long agent execution took (ms), populated on completion"""
  duration: Int
  
  """Input data (JSON string or plain text)"""
  inputMessages: String
  
  """Output/response from agent"""
  generatedResponse: String
  
  """Token consumption for this event"""
  tokenUsage: TokenUsage
  
  """Error details if state is 'failed'"""
  errorDetails: ErrorDetails
}

enum ProgressEventState {
  STARTED
  COMPLETED
  FAILED
}

"""
Token usage breakdown (input + output = total)
"""
type TokenUsage {
  input: Int!
  output: Int!
  total: Int!
}

"""
Error information for failed events
"""
type ErrorDetails {
  message: String!
  type: String
  stackTrace: String
}
```

**Resolver Implementation:**
```typescript
// apps/api/src/graphql/resolvers/taskProgressResolvers.ts
import taskProgressDomain from '@vassembly/domain-task-progress';
import { ForbiddenError } from '@vassembly/errors';

export const taskProgressResolvers = {
  Query: {
    taskProgress: async (
      _: unknown,
      args: { taskId: string },
      context: GraphQLContext
    ) => {
      const { userId } = context; // From auth middleware

      // Verify user owns this task
      // (domain handles this, or verify at handler level)
      const result = await taskProgressDomain.queries.getTaskProgressByTaskId({
        taskId: args.taskId,
        userId,
      });

      if (!result.data) {
        throw new NotFoundError('Task progress not found');
      }

      return result.data;
    },
  },
};
```

### 3.4 REST Endpoint (Optional, for Polling)

**Route:** `GET /api/tasks/:taskId/progress`

**Location:** API Gateway (`apps/api/src/routes/`)

**Handler:**
```typescript
// apps/api/src/routes/tasks/progress.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import taskProgressDomain from '@vassembly/domain-task-progress';

export const getTaskProgress = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { taskId } = request.params as { taskId: string };
  const userId = request.user.id;

  const result = await taskProgressDomain.queries.getTaskProgressByTaskId({
    taskId,
    userId,
  });

  if (!result.data) {
    return reply.status(404).send({ error: 'Task progress not found' });
  }

  reply.status(200).send(result.data);
};
```

### 3.5 Integration: How Events Are Recorded During Agent Execution

**Current flow** (assuming task execution service exists):
```typescript
// services/task-execution/src/handlers/executeTask/index.ts
import taskProgressService from '@vassembly/service-task';
import { recordTaskProgress } from '@vassembly/service-task/handlers';

export const executeTask = async (input: ExecuteTaskInput) => {
  const { taskId, userId, agents } = input;

  // Initialize task progress on start
  await recordTaskProgress({
    taskId,
    userId,
    agentName: 'root',
    state: 'started',
    timestamp: new Date(),
  });

  for (const agent of agents) {
    try {
      // Record agent start
      await recordTaskProgress({
        taskId,
        userId,
        agentName: agent.name,
        state: 'started',
        timestamp: new Date(),
        inputMessages: JSON.stringify(agent.input),
      });

      // Execute agent
      const startTime = Date.now();
      const result = await agent.execute();
      const duration = Date.now() - startTime;

      // Record agent completion
      await recordTaskProgress({
        taskId,
        userId,
        agentName: agent.name,
        state: 'completed',
        timestamp: new Date(),
        duration,
        generatedResponse: result.output,
        tokenUsage: {
          input: result.inputTokens,
          output: result.outputTokens,
          total: result.totalTokens,
        },
      });
    } catch (error) {
      // Record agent failure
      await recordTaskProgress({
        taskId,
        userId,
        agentName: agent.name,
        state: 'failed',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        errorDetails: {
          message: error.message,
          type: error.constructor.name,
          stackTrace: error.stack,
        },
      });
      throw error; // Halt execution
    }
  }

  // Final completion
  await taskDomain.commands.complete({
    taskId,
    llmResponse: 'Final result',
    completedAt: new Date(),
  });
};
```

---

## 4. Frontend Requirements

### 4.1 New UI Package: @vassembly/ui-execution-progress-tracker

**Purpose:** Reusable progress tracking components for any agent execution context

**Structure:**
```
ui/execution-progress-tracker/
├── src/
│   ├── index.ts
│   ├── ExecutionProgressTracker.tsx  # Main container
│   ├── ExecutionProgressTracker.module.scss
│   ├── types.ts
│   ├── _components/
│   │   ├── ProgressList.tsx
│   │   ├── ProgressList.module.scss
│   │   ├── ProgressItem.tsx
│   │   ├── ProgressItem.module.scss
│   │   ├── ProgressDetailModal.tsx
│   │   ├── ProgressDetailModal.module.scss
│   │   ├── TokenUsageWidget.tsx
│   │   ├── TokenUsageWidget.module.scss
│   │   ├── ProgressHeader.tsx
│   │   └── ProgressHeader.module.scss
│   ├── hooks/
│   │   ├── useProgressPolling.ts      # GraphQL polling hook
│   │   ├── useModalState.ts            # Modal open/close + focus management
│   │   ├── useRelativeTime.ts          # Relative time formatting + updates
│   │   └── useProgressData.ts          # State management for events
│   ├── utils/
│   │   ├── formatDuration.ts           # Format ms to "2m 34s"
│   │   ├── formatTokens.ts             # Format token counts with commas
│   │   ├── sortEventsByTimestamp.ts
│   │   └── calculateMetrics.ts         # Aggregate token counts, duration
│   ├── constants/
│   │   └── polling.ts                  # POLLING_INTERVAL_MS, etc.
│   └── ExecutionProgressTracker.test.tsx
├── package.json
└── README.md
```

### 4.2 Page Integration: Task Detail Edit Page

**Location:** `apps/web/app/agents/ai-integrations/[id]/edit/`

**Modified file:** `useAiIntegrationEditPage.tsx`

```typescript
// Add progress tracking integration
import ExecutionProgressTracker from '@vassembly/ui-execution-progress-tracker';

export function useAiIntegrationEditPage() {
  // ... existing code ...
  
  const [taskId, setTaskId] = useState<string | undefined>();
  const [shouldShowProgress, setShouldShowProgress] = useState(false);

  // When task is created/executed
  const handleTestConnection = async () => {
    const task = await createTask({ ...input });
    setTaskId(task.id);
    setShouldShowProgress(true);
  };

  return (
    <>
      <AiIntegrationForm {...formProps} />
      {shouldShowProgress && taskId && (
        <ExecutionProgressTracker
          taskId={taskId}
          onTaskCompleted={() => setShouldShowProgress(false)}
        />
      )}
    </>
  );
}
```

### 4.3 Custom Hooks for Progress Polling

**Hook 1: useProgressPolling**
```typescript
// ui/execution-progress-tracker/src/hooks/useProgressPolling.ts
import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { TASK_PROGRESS_QUERY } from '../graphql/taskProgressQuery';
import type { TaskProgressResponse, ProgressEventResponse } from '../types';

interface UseProgressPollingParams {
  taskId: string;
  userId: string;
  enabled: boolean;
  onDataReceived?: (data: TaskProgressResponse) => void;
  pollingInterval?: number; // Default 1000ms
}

export const useProgressPolling = ({
  taskId,
  userId,
  enabled,
  onDataReceived,
  pollingInterval = 1000,
}: UseProgressPollingParams) => {
  const [data, setData] = useState<TaskProgressResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: apolloData, loading, error: apolloError, refetch } = useQuery(
    TASK_PROGRESS_QUERY,
    {
      variables: { taskId },
      skip: !enabled || !taskId,
      pollInterval: enabled ? pollingInterval : 0,
      fetchPolicy: 'network-only',
    }
  );

  useEffect(() => {
    if (apolloData?.taskProgress) {
      setData(apolloData.taskProgress);
      onDataReceived?.(apolloData.taskProgress);
    }
  }, [apolloData]);

  useEffect(() => {
    if (apolloError) {
      setError(apolloError);
    }
  }, [apolloError]);

  return {
    data,
    error,
    isLoading: loading,
    refetch,
  };
};
```

**Hook 2: useModalState**
```typescript
// ui/execution-progress-tracker/src/hooks/useModalState.ts
import { useRef, useCallback, useEffect } from 'react';

interface UseModalStateParams {
  onClose?: () => void;
}

export const useModalState = ({ onClose }: UseModalStateParams = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openModal = useCallback((eventId: string) => {
    setSelectedEventId(eventId);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    onClose?.();
    // Return focus to trigger
    triggerRef.current?.focus();
  }, [onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  return {
    isOpen,
    selectedEventId,
    openModal,
    closeModal,
    triggerRef,
  };
};
```

### 4.4 GraphQL Query (Frontend)

**Location:** `ui/execution-progress-tracker/src/graphql/taskProgressQuery.ts`

```typescript
import { gql } from '@apollo/client';

export const TASK_PROGRESS_QUERY = gql`
  query TaskProgress($taskId: ID!) {
    taskProgress(taskId: $taskId) {
      id
      taskId
      status
      startedAt
      completedAt
      totalDuration
      totalTokens {
        input
        output
        total
      }
      events {
        id
        agentName
        state
        timestamp
        duration
        inputMessages
        generatedResponse
        tokenUsage {
          input
          output
          total
        }
        errorDetails {
          message
          type
          stackTrace
        }
      }
    }
  }
`;
```

---

## 5. Integration Points

### 5.1 Where Progress Events Are Captured

| Component | Location | Trigger | Action |
|-----------|----------|---------|--------|
| **Agent Executor** | `services/task-execution/handlers/` | Before agent call | Call `recordTaskProgress(state: 'started')` |
| **Agent Executor** | `services/task-execution/handlers/` | After agent success | Call `recordTaskProgress(state: 'completed', tokenUsage, output)` |
| **Agent Executor** | `services/task-execution/handlers/` | On agent error | Call `recordTaskProgress(state: 'failed', errorDetails)` |
| **Task Completion** | Task domain command | Task.status → "done" | Task service finalizes progress |

### 5.2 How Progress Events Are Appended

**Mechanism:** MongoDB atomic `$push` operator

```typescript
// domains/task-progress/src/commands/recordProgressEvent/index.ts
import { recordProgressEvent } = createDb({
  dao: taskProgressMongodbDao,
  // Custom operation: append to events array
  updateOperation: (input) => ({
    $push: {
      events: {
        _id: new ObjectId(),
        agentName: input.agentName,
        state: input.state,
        timestamp: new Date(input.timestamp),
        duration: input.duration,
        inputMessages: input.inputMessages,
        generatedResponse: input.generatedResponse,
        tokenUsage: input.tokenUsage,
        errorDetails: input.errorDetails,
      },
    },
  }),
});
```

### 5.3 When Polling Starts/Stops

| Condition | Action |
|-----------|--------|
| Task created, status = "created" | No polling (progress panel hidden or shows empty state) |
| Task status changes to "in-progress" | Start polling every 1s |
| Polling receives task.status ∈ ["done", "failed"] | Stop polling |
| User navigates away from page | Cleanup: stop polling, cancel queries |
| API returns 404 (task deleted) | Stop polling, show error |

---

## 6. API Contracts

### 6.1 GraphQL Query (Complete Schema)

**Query name:** `taskProgress(taskId: ID!)`

**Request:**
```graphql
query GetTaskProgress($taskId: ID!) {
  taskProgress(taskId: $taskId) {
    id
    taskId
    status
    startedAt
    completedAt
    totalDuration
    totalTokens {
      input
      output
      total
    }
    events {
      id
      agentName
      state
      timestamp
      duration
      inputMessages
      generatedResponse
      tokenUsage {
        input
        output
        total
      }
      errorDetails {
        message
        type
        stackTrace
      }
    }
  }
}
```

**Sample Response (In Progress):**
```json
{
  "data": {
    "taskProgress": {
      "id": "prog-12345",
      "taskId": "task-12345",
      "status": "IN_PROGRESS",
      "startedAt": "2026-06-15T14:00:00.000Z",
      "completedAt": null,
      "totalDuration": 8500,
      "totalTokens": {
        "input": 1200,
        "output": 580,
        "total": 1780
      },
      "events": [
        {
          "id": "evt-001",
          "agentName": "Assistant",
          "state": "STARTED",
          "timestamp": "2026-06-15T14:00:00.100Z",
          "duration": null,
          "inputMessages": "{\"prompt\": \"Analyze data\"}",
          "generatedResponse": null,
          "tokenUsage": null,
          "errorDetails": null
        },
        {
          "id": "evt-002",
          "agentName": "Data Analyzer",
          "state": "STARTED",
          "timestamp": "2026-06-15T14:00:01.200Z",
          "duration": null,
          "inputMessages": "{\"data\": [...]}",
          "generatedResponse": null,
          "tokenUsage": null,
          "errorDetails": null
        },
        {
          "id": "evt-003",
          "agentName": "Data Analyzer",
          "state": "COMPLETED",
          "timestamp": "2026-06-15T14:00:09.400Z",
          "duration": 8200,
          "inputMessages": null,
          "generatedResponse": "Analysis complete: 23% growth",
          "tokenUsage": {
            "input": 1200,
            "output": 580,
            "total": 1780
          },
          "errorDetails": null
        }
      ]
    }
  }
}
```

**Sample Response (Completed):**
```json
{
  "data": {
    "taskProgress": {
      "id": "prog-12345",
      "taskId": "task-12345",
      "status": "COMPLETED",
      "startedAt": "2026-06-15T14:00:00.000Z",
      "completedAt": "2026-06-15T14:00:12.500Z",
      "totalDuration": 12500,
      "totalTokens": {
        "input": 2545,
        "output": 1242,
        "total": 3787
      },
      "events": [
        { /* ... all events ... */ }
      ]
    }
  }
}
```

**Error Response (Task Not Found):**
```json
{
  "errors": [
    {
      "message": "Task progress not found",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ],
  "data": null
}
```

### 6.2 Polling Strategy

| Aspect | Value | Notes |
|--------|-------|-------|
| **Interval** | 1000ms (1s) | Configurable in `ui-execution-progress-tracker` constants |
| **Timeout** | 500ms (target) | P95 response time per PRD |
| **Retry** | Exponential backoff | 1s → 2s → 5s max |
| **Max wait** | 5 minutes | If no progress after 5min, show warning |
| **Stop condition** | task.status ∈ ["done", "failed"] | Check in `useProgressPolling` |

---

## 7. Detailed Task Breakdown

### Phase 1 Tasks (MVP)

#### **Backend Tasks**

##### Task 1: Create @vassembly/domain-task-progress Domain Package

**Type:** New domain package

**Files to create/modify:**
- `domains/task-progress/package.json` (new)
- `domains/task-progress/tsconfig.json` (new, template)
- `domains/task-progress/vitest.config.ts` (new, template)
- `domains/task-progress/src/index.ts` (new)
- `domains/task-progress/src/model/model.ts` (new)
- `domains/task-progress/src/model/dto.ts` (new)
- `domains/task-progress/src/model/factories.ts` (new)
- `domains/task-progress/src/model/toTaskProgressResponse.ts` (new)
- `domains/task-progress/src/model/graphql.ts` (new)
- `domains/task-progress/src/model/index.ts` (new)
- `domains/task-progress/src/commands/index.ts` (new)
- `domains/task-progress/src/commands/initializeTaskProgress/index.ts` (new)
- `domains/task-progress/src/commands/initializeTaskProgress/types.ts` (new)
- `domains/task-progress/src/commands/recordProgressEvent/index.ts` (new)
- `domains/task-progress/src/commands/recordProgressEvent/types.ts` (new)
- `domains/task-progress/src/commands/finalizeTaskProgress/index.ts` (new)
- `domains/task-progress/src/commands/finalizeTaskProgress/types.ts` (new)
- `domains/task-progress/src/queries/index.ts` (new)
- `domains/task-progress/src/queries/getTaskProgressByTaskId/index.ts` (new)
- `domains/task-progress/src/queries/getTaskProgressByTaskId/types.ts` (new)
- `domains/task-progress/src/queries/getModelByTaskId/index.ts` (new)
- `domains/task-progress/src/clients/mongodb.ts` (new)
- `domains/task-progress/src/clients/index.ts` (new)
- `domains/task-progress/README.md` (new)

**Effort:** Large (80–100 points)

**Dependencies:** None (first backend task)

**Key Implementation Details:**
- Use MongoDB `$push` for atomic event appending
- Validate `userId` for auth scoping
- Create index on `(taskId, userId)` for fast lookups
- Implement idempotent `initializeTaskProgress` (check if exists before create)
- Calculate `totalDuration` and `totalTokens` in `finalizeTaskProgress`

---

##### Task 2: Extend @vassembly/service-task with recordTaskProgress Handler

**Type:** Extend existing service

**Files to create/modify:**
- `services/task/src/handlers/recordTaskProgress/index.ts` (new)
- `services/task/src/handlers/recordTaskProgress/types.ts` (new)
- `services/task/src/handlers/recordTaskProgress/index.test.ts` (new)
- `services/task/src/handlers/index.ts` (modify - export new handler)

**Effort:** Medium (40–50 points)

**Dependencies:** Task 1 (domain package must exist)

**Key Implementation Details:**
- Validate task ownership (user can only record progress for their tasks)
- Handle missing taskProgress (create if doesn't exist)
- Integrate with existing task service without breaking changes
- Error handling: NotFoundError if task doesn't exist, ForbiddenError if not owner

---

##### Task 3: Implement GraphQL Query in API Gateway

**Type:** New GraphQL resolver

**Files to create/modify:**
- `apps/api/src/graphql/schema/taskProgress.gql` (new, schema definition)
- `apps/api/src/graphql/resolvers/taskProgressResolvers.ts` (new)
- `apps/api/src/graphql/index.ts` (modify - register schema & resolvers)

**Effort:** Medium (40–50 points)

**Dependencies:** Task 1 (domain must be queryable)

**Key Implementation Details:**
- Register GraphQL schema with taskProgressResolvers
- Extract userId from context (auth middleware)
- Map domain DTO to GraphQL response types
- Handle date serialization (ISO 8601 strings)
- Verify user owns the task before returning progress

---

##### Task 4: Write Unit Tests for Domain & Service

**Type:** Unit tests

**Files to create/modify:**
- `domains/task-progress/src/commands/*/index.test.ts` (multiple)
- `domains/task-progress/src/queries/*/index.test.ts` (multiple)
- `services/task/src/handlers/recordTaskProgress/index.test.ts`

**Effort:** Medium (30–40 points)

**Dependencies:** Tasks 1, 2

**Test Coverage:**
- Command: Initialize, record event, finalize
- Query: Fetch by taskId, verify user scoping
- Service handler: Orchestration, error paths, validation

---

#### **Frontend Tasks**

##### Task 5: Create @vassembly/ui-execution-progress-tracker UI Package

**Type:** New UI component package

**Files to create/modify:**
- `ui/execution-progress-tracker/package.json` (new)
- `ui/execution-progress-tracker/tsconfig.json` (new)
- `ui/execution-progress-tracker/src/index.ts` (new)
- `ui/execution-progress-tracker/src/ExecutionProgressTracker.tsx` (new)
- `ui/execution-progress-tracker/src/ExecutionProgressTracker.module.scss` (new)
- `ui/execution-progress-tracker/src/types.ts` (new)
- `ui/execution-progress-tracker/src/_components/ProgressList.tsx` (new)
- `ui/execution-progress-tracker/src/_components/ProgressList.module.scss` (new)
- `ui/execution-progress-tracker/src/_components/ProgressItem.tsx` (new)
- `ui/execution-progress-tracker/src/_components/ProgressItem.module.scss` (new)
- `ui/execution-progress-tracker/src/_components/ProgressDetailModal.tsx` (new)
- `ui/execution-progress-tracker/src/_components/ProgressDetailModal.module.scss` (new)
- `ui/execution-progress-tracker/src/_components/TokenUsageWidget.tsx` (new)
- `ui/execution-progress-tracker/src/_components/TokenUsageWidget.module.scss` (new)
- `ui/execution-progress-tracker/src/hooks/useProgressPolling.ts` (new)
- `ui/execution-progress-tracker/src/hooks/useModalState.ts` (new)
- `ui/execution-progress-tracker/src/hooks/useRelativeTime.ts` (new)
- `ui/execution-progress-tracker/src/utils/formatDuration.ts` (new)
- `ui/execution-progress-tracker/src/utils/formatTokens.ts` (new)
- `ui/execution-progress-tracker/src/utils/sortEventsByTimestamp.ts` (new)
- `ui/execution-progress-tracker/src/utils/calculateMetrics.ts` (new)
- `ui/execution-progress-tracker/src/constants/polling.ts` (new)
- `ui/execution-progress-tracker/src/graphql/taskProgressQuery.ts` (new)
- `ui/execution-progress-tracker/README.md` (new)

**Effort:** Large (100–120 points)

**Dependencies:** None (independent frontend work; backend API must be live)

**Key Implementation Details:**
- Implement glassmorphic modal per design spec
- Use SCSS modules with design tokens (surface-container, primary, etc.)
- Custom hooks for polling, modal state, relative time
- Accessibility: keyboard nav, ARIA labels, focus trap, live region for announcements
- Responsive design: mobile (320–767), tablet (768–1023), desktop (1024+)
- Error state: show toast/banner, retry button, continue polling in background
- Performance: React.memo for ProgressItem, lazy-load modal detail

---

##### Task 6: Integrate ExecutionProgressTracker into Task Detail Page

**Type:** Page integration

**Files to create/modify:**
- `apps/web/app/agents/ai-integrations/[id]/edit/useAiIntegrationEditPage.tsx` (modify)
- `apps/web/app/agents/ai-integrations/[id]/edit/AiIntegrationEditPage.tsx` (modify - import tracker)

**Effort:** Small (20–30 points)

**Dependencies:** Task 5 (UI package must exist)

**Key Implementation Details:**
- Import `ExecutionProgressTracker` component
- Pass `taskId` and `userId` as props
- Handle task creation flow: show tracker after task is created
- Stop polling when task completes (listen to status changes)
- Manage layout: place below form, full width, scrollable

---

##### Task 7: Write E2E Tests (Acceptance Tests)

**Type:** E2E tests

**Files to create/modify:**
- `apps/web/e2e/features/real-time-execution-progress/progress-tracking.feature` (new, Gherkin)
- `apps/web/e2e/steps/execution-progress/...ts` (new, step definitions)

**Effort:** Medium (40–50 points)

**Dependencies:** Tasks 5, 6 (UI and integration must be complete)

**Test Scenarios:**
- Scenario 1: Task starts, events appear in list in real-time
- Scenario 2: Click event, modal opens with correct data
- Scenario 3: Relative timestamps update every 60s
- Scenario 4: Polling stops when task completes
- Scenario 5: Page refresh shows same events (persisted)
- Scenario 6: Error state: polling fails, retry button shows, polling resumes
- Scenario 7: Modal closes on Escape key and focus returns

---

#### **Integration & Testing Tasks**

##### Task 8: Integration Test: Backend API ↔ Frontend Polling

**Type:** Integration test

**Files to create/modify:**
- `apps/web/e2e/fixtures/taskProgress.ts` (new, shared fixtures)
- `apps/api/src/routes/tasks/progress.test.ts` (new, REST route test)

**Effort:** Medium (30–40 points)

**Dependencies:** Tasks 2, 3, 5, 6

**Test Scenarios:**
- Verify GraphQL query returns correct TaskProgress shape
- Verify polling hook fetches updates at correct interval
- Verify new events append without full page refresh
- Verify error handling (API error → retry)

---

##### Task 9: Documentation & Migration

**Type:** Documentation + deployment

**Files to create/modify:**
- `domains/task-progress/README.md` (complete)
- `ui/execution-progress-tracker/README.md` (complete)
- `docs/features/real-time-execution-progress/IMPLEMENTATION.md` (new, completion notes)
- MongoDB migration script: Create `taskProgress` collection and indexes

**Effort:** Small (20–25 points)

**Dependencies:** All other tasks (documentation closes out feature)

**Key Implementation Details:**
- Document domain commands, queries, types
- Document UI component props, usage examples
- Create migration script for production deployment
- Update monorepo README with new packages

---

### Summary Table

| # | Task | Type | Effort | Dependencies |
|---|------|------|--------|--------------|
| 1 | Create domain-task-progress domain | Backend | Large (80–100) | None |
| 2 | Extend service-task handler | Backend | Medium (40–50) | 1 |
| 3 | GraphQL query resolver | Backend | Medium (40–50) | 1 |
| 4 | Backend unit tests | Testing | Medium (30–40) | 1, 2 |
| 5 | Create UI component package | Frontend | Large (100–120) | None (parallel) |
| 6 | Integrate into task detail page | Frontend | Small (20–30) | 5 |
| 7 | E2E acceptance tests | Testing | Medium (40–50) | 5, 6 |
| 8 | API ↔ Frontend integration test | Testing | Medium (30–40) | 2, 3, 5, 6 |
| 9 | Documentation & migration | Ops | Small (20–25) | 1–8 |

**Total effort:** ~430–480 points (3–4 week sprint for 2-person team)

**Parallelization:** Backend tasks 1, 2, 3 can start immediately. Frontend task 5 can start in parallel (uses mocked GraphQL). Task 6 requires task 5. Tasks 4, 7, 8, 9 are dependent on other tasks.

---

## 8. Technical Considerations

### 8.1 Database Design

#### Indexing Strategy

```typescript
// domains/task-progress/src/clients/mongodb.ts
const indexes = [
  // Primary: Fast lookups by taskId + userId (polling queries)
  { key: { taskId: 1, userId: 1 }, unique: false, name: 'idx_taskId_userId' },
  
  // Secondary: User-scoped list (future: list all progress for user)
  { key: { userId: 1, createdAt: -1 }, unique: false, name: 'idx_userId_createdAt' },
  
  // TTL: Auto-cleanup completed tasks after 90 days (optional)
  { key: { completedAt: 1 }, expireAfterSeconds: 7776000, name: 'idx_ttl_completedAt' },
];
```

#### Atomic Appends

Use MongoDB `$push` operator to avoid race conditions:

```typescript
// Atomic append to events[] array
db.collection('taskProgress').updateOne(
  { taskId: taskId },
  {
    $push: {
      events: {
        _id: new ObjectId(),
        agentName: '...',
        state: '...',
        // ... other fields
      },
    },
  },
  { upsert: false } // Fail if doc doesn't exist (init first)
);
```

#### Document Size Limits

**BSON max size:** 16MB

**Estimation:**
- One event: ~500 bytes (name + state + timestamp + tokens + response snippet)
- 1,000 events: ~500KB (well under limit)
- Safety margin: Support up to 2,000 events per task before archival

**Phase 2 optimization:** Archive old events to separate collection if exceeding 1,000 events

### 8.2 Concurrency & Race Conditions

**Scenario:** Two progress events recorded simultaneously for same task

**Solution:** MongoDB session transactions + `$push` atomicity

```typescript
// Atomic push ensures only one writer succeeds; others wait
db.collection('taskProgress').updateOne(
  { taskId: taskId },
  { $push: { events: newEvent } },
  { upsert: false }
);
```

**No special handling needed:** MongoDB handles document-level locking

### 8.3 Error Handling & Recovery

| Scenario | Solution |
|----------|----------|
| Task record doesn't exist | Throw `TaskNotFoundError` with 404 status |
| User doesn't own task | Throw `ForbiddenError` with 403 status |
| taskProgress doc doesn't exist on append | Initialize first (idempotent) |
| API timeout during polling | Client shows retry banner; polling continues with exponential backoff |
| GraphQL query returns null | Frontend shows "No progress available"; still polling |
| Duplicate event records | Events array grows, but timestamps are unique; sorting by timestamp on display |

### 8.4 Performance Optimization

| Optimization | Implementation |
|--------------|-----------------|
| **Query caching** | Apollo Client polling with `network-only` fetch policy (always fresh) |
| **Virtual scrolling** | Phase 2: Use `react-window` for lists >100 items |
| **Lazy modal detail** | Detail modal content fetched on-demand (data already in events[]) |
| **Memoization** | `React.memo(ProgressItem)` to prevent re-renders on list update |
| **Debounced polling** | Stop polling while modal is closed + user idle (future optimization) |
| **Aggregation caching** | Calculate `totalTokens`, `totalDuration` only on `finalizeTaskProgress` |

### 8.5 Data Retention & Cleanup

**Strategy:** 90-day TTL on `completedAt` field

```javascript
// MongoDB TTL index
db.taskProgress.createIndex(
  { completedAt: 1 },
  { expireAfterSeconds: 7776000 } // 90 days
);
```

**Manual purge (if needed):**
```javascript
db.taskProgress.deleteMany({
  completedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
});
```

### 8.6 Nested Agents (Phase 2 Foundation)

**Schema preparation** (already in types):
- `ProgressEvent.parentAgentId` — ID of parent event
- `ProgressEvent.childAgentIds[]` — Array of child event IDs

**Phase 2 implementation:**
- Tree view component rendering nested events
- Collapsible parent nodes
- Indented visual layout with connector lines
- Same polling mechanism; no schema changes needed

---

## 9. Monorepo Integration

### 9.1 Package Dependencies

```
apps/web
  └─ depends on: @vassembly/ui-execution-progress-tracker, @vassembly/ui-api-hooks

ui/execution-progress-tracker
  └─ depends on: @vassembly/ui-system-design/button, @vassembly/ui-system-design/alert, @apollo/client, react

services/task
  └─ depends on: @vassembly/domain-task-progress, @vassembly/domain-task

domains/task-progress
  └─ depends on: @vassembly/client-mongodb, @vassembly/commands, @vassembly/queries,
                  @vassembly/errors, @vassembly/mappers, zod

apps/api
  └─ depends on: @vassembly/domain-task-progress (GraphQL resolvers)
```

### 9.2 Package Placement Decisions

| Package | Location | Rationale |
|---------|----------|-----------|
| `domain-task-progress` | `domains/` | Core entity; reusable across services |
| `service-task` handler | `services/task/` | Orchestration layer; extends existing service |
| `ui-execution-progress-tracker` | `ui/` | Reusable UI component for any progress tracking |
| GraphQL schema | `apps/api/src/graphql/` | API Gateway concern; co-located with routes |

### 9.3 Dependency Graph

```
┌─────────────────────────────────────────────┐
│          apps/web (Next.js app)             │
│  ┌───────────────────────────────────────┐  │
│  │ ExecutionProgressTracker component    │  │
│  │ + useProgressPolling hook             │  │
│  └───────────────────────────────────────┘  │
│           │                                  │
│           ↓ uses                             │
│  ┌───────────────────────────────────────┐  │
│  │ @vassembly/ui-execution-progress-tracker
│  │ + graphql/taskProgressQuery.ts        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
           │
           ↓ queries via GraphQL
┌─────────────────────────────────────────────┐
│         apps/api (GraphQL Gateway)          │
│  ┌───────────────────────────────────────┐  │
│  │ taskProgressResolvers.ts              │  │
│  └───────────────────────────────────────┘  │
│           │                                  │
│           ↓ calls                            │
│  ┌───────────────────────────────────────┐  │
│  │ @vassembly/domain-task-progress       │  │
│  │ + queries.getTaskProgressByTaskId()   │  │
│  └───────────────────────────────────────┘  │
│           │                                  │
│           ↓ writes/reads                     │
│  ┌───────────────────────────────────────┐  │
│  │ MongoDB: taskProgress collection      │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

Agent Execution Flow:
┌─────────────────────────────────────────────┐
│     services/task-execution (worker)        │
│  ┌───────────────────────────────────────┐  │
│  │ Agent orchestration loop              │  │
│  └───────────────────────────────────────┘  │
│           │                                  │
│           ↓ calls recordTaskProgress         │
│  ┌───────────────────────────────────────┐  │
│  │ @vassembly/service-task               │  │
│  │ + handlers.recordTaskProgress()       │  │
│  └───────────────────────────────────────┘  │
│           │                                  │
│           ↓ calls commands                   │
│  ┌───────────────────────────────────────┐  │
│  │ @vassembly/domain-task-progress       │  │
│  │ + commands.recordProgressEvent()      │  │
│  └───────────────────────────────────────┘  │
│           │                                  │
│           ↓ writes                           │
│  ┌───────────────────────────────────────┐  │
│  │ MongoDB: taskProgress.events[]        │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 10. Design Patterns & Conventions

### 10.1 API Calling Convention

**Workspace rule:** GraphQL for reads, REST for commands

**Application:**
- **GraphQL:** `taskProgress(taskId: ID!)` — fetch progress data (read-only)
- **REST:** Not needed (no mutations on taskProgress directly; only reads)

### 10.2 Error Handling Using @vassembly/errors

```typescript
import { NotFoundError, ForbiddenError, ValidationError } from '@vassembly/errors';

// Domain queries
if (!taskProgress) throw new NotFoundError('Task progress not found');

// Auth validation
if (taskProgress.userId !== requestUserId) {
  throw new ForbiddenError('Unauthorized');
}

// Command validation
if (!taskId) throw new ValidationError('taskId is required');
```

### 10.3 File Structure Conventions

**Backend (domain package):**
- Commands: One file per command (create, update, etc.)
- Queries: One file per query type (getById, getList, etc.)
- Models: Entity class + factories + DTOs + mappers
- Clients: MongoDB DAO + index bootstrap

**Frontend (UI package):**
- Components: One component per file + SCSS module
- Hooks: One custom hook per file
- Utils: Standalone pure functions (format, calculate, sort, etc.)
- Graphql: Query documents co-located near hooks that use them

### 10.4 Testing Patterns

**Backend unit tests:**
- Mock domain dependencies
- Test as black box (input → output)
- Validate error scenarios
- Use vitest + `describe()` / `it()` blocks

**Frontend component tests:**
- Mock useQuery hook to return test data
- Test user interactions (click, keyboard)
- Verify rendering (snapshot or DOM queries)
- Use vitest + React Testing Library (or Playwright)

**E2E acceptance tests:**
- Use Playwright BDD with Gherkin syntax
- Test complete user flow (create task → events appear → click modal)
- No mocks (test real API)
- Step definitions co-located in `apps/web/e2e/steps/`

### 10.5 Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Domain | Kebab-case | `domain-task-progress` |
| UI package | Kebab-case | `ui-execution-progress-tracker` |
| Service | Kebab-case | `service-task` |
| Handler | camelCase | `recordTaskProgress` |
| Component | PascalCase | `ExecutionProgressTracker`, `ProgressItem` |
| Hook | camelCase prefix `use` | `useProgressPolling`, `useModalState` |
| Util function | camelCase | `formatDuration`, `calculateMetrics` |
| SCSS module | Same as component + `.module.scss` | `ProgressItem.module.scss` |
| Query/Mutation | camelCase with uppercase first | `GetTaskProgress`, `RecordProgressEvent` |
| GraphQL type | PascalCase | `TaskProgress`, `ProgressEvent` |

---

## 11. Implementation Checklist

### Phase 1: Backend Core

- [ ] **Create domain-task-progress package**
  - [ ] Model class (`TaskProgressModel`)
  - [ ] DTO types (`TaskProgressResponse`)
  - [ ] Factories and mappers
  - [ ] GraphQL schema definition
  - [ ] MongoDB DAO with indexes
  - [ ] Commands: initializeTaskProgress, recordProgressEvent, finalizeTaskProgress
  - [ ] Queries: getTaskProgressByTaskId, getModelByTaskId
  - [ ] Unit tests for all commands and queries
  - [ ] README.md with usage examples

- [ ] **Extend service-task**
  - [ ] recordTaskProgress handler
  - [ ] Types and validation
  - [ ] Integration with domain
  - [ ] Error handling
  - [ ] Unit tests
  - [ ] Update service README

- [ ] **API Gateway GraphQL**
  - [ ] Schema definition (taskProgress query, types)
  - [ ] Resolvers (fetch, map to DTOs)
  - [ ] Error handling
  - [ ] Integration tests
  - [ ] Register schema in GraphQL builder

### Phase 1: Frontend Core

- [ ] **Create UI package: ui-execution-progress-tracker**
  - [ ] Component structure (ProgressList, ProgressItem, Modal)
  - [ ] Styling with SCSS modules (glassmorphic design)
  - [ ] Custom hooks (useProgressPolling, useModalState, useRelativeTime)
  - [ ] Utility functions (formatDuration, formatTokens, calculateMetrics)
  - [ ] GraphQL query document
  - [ ] Accessibility (keyboard, ARIA, focus management)
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Error/loading/empty states
  - [ ] Unit tests for components and hooks
  - [ ] README.md with props and usage

- [ ] **Integrate into Task Detail Page**
  - [ ] Import and add ExecutionProgressTracker to page
  - [ ] Pass taskId and userId props
  - [ ] Handle task creation flow
  - [ ] Manage polling start/stop
  - [ ] Test integration

### Phase 1: Testing & QA

- [ ] **Unit tests**
  - [ ] Backend: domain commands/queries/service
  - [ ] Frontend: components, hooks, utilities
  - [ ] Test coverage >80%

- [ ] **E2E Acceptance tests (Gherkin)**
  - [ ] Scenario 1: Real-time progress monitoring
  - [ ] Scenario 2: Click event → modal opens
  - [ ] Scenario 3: Persistence after page refresh
  - [ ] Scenario 4: Polling stops on task completion
  - [ ] Scenario 5: Error handling + retry
  - [ ] Scenario 6: Empty/loading states
  - [ ] Scenario 7: Accessibility (keyboard nav, screen reader)

- [ ] **Integration testing**
  - [ ] API ↔ Frontend: Verify GraphQL query works
  - [ ] Polling ↔ Database: Verify atomicity of event appends
  - [ ] Service ↔ Domain: Verify handler calls commands correctly

- [ ] **QA Manual Testing**
  - [ ] Test on Chrome, Firefox, Safari (latest)
  - [ ] Test on mobile (iOS Safari, Chrome), tablet, desktop
  - [ ] Performance: Monitor polling latency, memory usage
  - [ ] Accessibility: Screen reader (NVDA/JAWS), keyboard-only navigation
  - [ ] Error scenarios: Network failure, task deletion, auth loss

### Phase 1: Documentation & Deployment

- [ ] **Documentation**
  - [ ] Domain README: Features, types, commands, queries
  - [ ] UI package README: Props, hooks, styling
  - [ ] Architecture doc (this file): Complete handoff for team
  - [ ] Migration guide: Create indexes, deploy steps
  - [ ] Update monorepo docs: Link to new packages

- [ ] **Deployment**
  - [ ] Create MongoDB migration script (indexes, TTL)
  - [ ] Test production deployment (staging environment)
  - [ ] Verify GraphQL schema registered in API
  - [ ] Smoke test: Poll for live task progress
  - [ ] Monitor: Latency, error rates, memory usage

- [ ] **Post-Launch**
  - [ ] Monitor error rates and latency (first week)
  - [ ] Gather user feedback
  - [ ] Plan Phase 2 enhancements (nested agents, WebSocket, etc.)

---

## Implementation Success Criteria

| Criteria | Measurement |
|----------|-------------|
| **API Response Time (p95)** | ≤ 500ms (per PRD) |
| **Polling Latency** | ≤ 1s (per PRD) |
| **Events Visibility** | 100% of events appear without page refresh |
| **Token Accuracy** | All token counts match backend calculations |
| **Error Clarity** | Failed events show readable error messages |
| **Data Persistence** | Progress events persist after page refresh |
| **Test Coverage** | ≥80% unit tests, ≥5 E2E acceptance tests |
| **Accessibility (a11y)** | WCAG AA compliance; keyboard nav works; screen reader friendly |
| **Responsive Design** | UI functional on 320px (mobile) to 2560px (wide desktop) |
| **Performance** | No memory leaks after 10min polling; modal opens <100ms |

---

## 12. Post-Implementation Fixes

**Document status:** Post-implementation remediation plan  
**Last updated:** 2026-06-15  
**Scope:** Four defects found after initial feature delivery

### 12.1 Summary

| # | Issue | Root cause (one line) | Fix strategy |
|---|-------|----------------------|--------------|
| 1 | `agentName` stores MongoDB IDs | `executeTask` passes `task.agentAssignedId` into `agentName` field | Rename stored field to `agentId`; resolve display name at read time |
| 2 | `tokenUsage` never persisted | LangChain client omits usage; ai-integration wrapper strips it; `finalizeTaskProgress` unwired | Plumb usage through invoke pipeline; call finalize on task completion |
| 3 | Task detail shows synthetic timeline | `page.tsx` renders `TaskDetailTimeline`, not `ExecutionProgressTracker` | Wire existing tracker component; remove synthetic path |
| 4 | Timeline shows `TBD` | `buildSyntheticTimelineEvents` hardcodes placeholder | Resolved by #3; delete synthetic timeline code |

---

### 12.2 Root Cause Analysis

#### Issue 1: `agentName` stores agent IDs instead of names

**Symptom:** Progress events display raw MongoDB ObjectIds (e.g. `674a1b2c3d4e5f6789012345`) in the UI.

**Root cause chain:**

1. `services/task/src/handlers/executeTask/index.ts` records progress with `agentName: task.agentAssignedId` (lines 67, 95, 126) — the field name implies a display name but receives an ID.
2. `domains/task-progress` model, command validation, DTO, and GraphQL schema all define `agentName: string` with no separate `agentId`.
3. No read-time enrichment exists in the API resolver or UI to map ID → name.

**Design correction:** Events must store **`agentId`** (immutable reference). Display names are derived at query/UI time from `@vassembly/domain-system-agent` (tasks currently assign system agents via `createTask` → `getActiveByName`).

---

#### Issue 2: `tokenUsage` not saved to DB

**Symptom:** Completed progress events have no `tokenUsage`; `totalTokens` on the task progress document stays `{ input: 0, output: 0, total: 0 }`.

**Root cause chain:**

```
executeTask
  → runAgentInvokeWithTools (forwards usage: result.usage)
    → systemAgentDomain.commands.invoke (passes response.usage)
      → aiIntegrationDomain ModeledProviderClient.invoke
        → client-langchain invokeWithChatModel
          → returns { message, model, toolUsage } only — NO usage
```

1. `packages/client-langchain/src/operations/invokeWithChatModel.ts` never extracts token counts from LangChain `AIMessage` metadata (`usage_metadata` / `response_metadata.token_usage`).
2. `domains/ai-integration/src/clients/langchain.ts` — `ModeledProviderClient` return type is `{ message, toolUsage? }`; usage is structurally impossible.
3. `executeTask` correctly maps `invokeResult.usage` → `tokenUsage` on the completed event, but `invokeResult.usage` is always `undefined`.
4. `finalizeTaskProgress` command exists and aggregates per-event tokens into `totalTokens`, but **no service handler calls it** after task completion/failure.

---

#### Issue 3: Task detail page does not fetch real progress

**Symptom:** Task detail `/tasks/[id]` shows a static synthetic activity list; live execution events from `taskProgress` GraphQL query never appear.

**Root cause:**

1. `apps/web/app/tasks/[id]/page.tsx` renders `<TaskDetailTimeline task={view.task} />` (line 31).
2. `TaskDetailTimeline` → `useTaskDetailTimeline` → `buildSyntheticTimelineEvents(task)` — derives events from task status timestamps only.
3. `@vassembly/ui-execution-progress-tracker` is fully implemented and wired only on `apps/web/app/agents/ai-integrations/[id]/edit/AiIntegrationEditPage.tsx`.

**Secondary blocker — incomplete GraphQL schema:**

`domains/task-progress/src/model/graphql.ts` defines `TaskProgress` without `events` or `totalTokens`, and `ProgressEvent` without `tokenUsage` or `errorDetails`. The UI query in `ui/execution-progress-tracker/src/graphql/taskProgressQuery.ts` requests these fields — they may fail schema validation or return null depending on Pothos registration order.

**Secondary blocker — status casing mismatch:**

| Layer | Status values |
|-------|---------------|
| Domain / MongoDB | `in-progress`, `completed`, `failed` |
| UI types / polling stop logic | `IN_PROGRESS`, `COMPLETED`, `FAILED` |

`useProgressPolling.ts` (line 33) and `ExecutionProgressTracker.tsx` (line 19) compare against uppercase; polling never stops on terminal status.

**Secondary blocker — event state casing:**

Domain stores `started` / `completed` / `failed` (lowercase). UI `ProgressItem` icons expect `STARTED` / `COMPLETED` / `FAILED`.

---

#### Issue 4: Timeline shows `TBD` instead of agent name

**Symptom:** All synthetic timeline rows show author `TBD`.

**Root cause:** `apps/web/app/tasks/[id]/lib/buildSyntheticTimelineEvents.ts` line 23 sets `TIMELINE_AUTHOR_PLACEHOLDER = 'TBD'` for every event and never reads `task.agentAssignedId`.

**Resolution:** This is a symptom of Issue 3. Replacing the synthetic timeline with `ExecutionProgressTracker` (plus Issue 1 name resolution) fixes display. No separate fix needed for `buildSyntheticTimelineEvents` beyond removal.

---

### 12.3 Recommendation (Conservative, Maximum Reuse)

**Do not create new packages.** Extend four existing areas:

1. **Token pipeline** — add usage extraction to `@vassembly/client-langchain`; pass through existing `ModeledProviderClient` and `runAgentInvokeWithTools` chain (types already expect `usage`).
2. **Domain rename** — `agentName` → `agentId` in `@vassembly/domain-task-progress` only; no new domain.
3. **Read-time name resolution** — API gateway field resolver on `ProgressEvent.agentName` (computed, not stored); batch-load system agents by unique IDs in the event list.
4. **UI wiring** — drop in existing `ExecutionProgressTracker` on task detail page; fix casing normalization in the UI package (one mapper, not per-component switches).
5. **Finalize hook** — call existing `finalizeTaskProgress` from `executeTask` success/error paths (command already implemented).

**Trade-offs considered:**

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Store agent name on events | Simple reads | Stale if agent renamed | ❌ Rejected |
| UI fetches system agents list | No API change | Extra query; N+1 risk | ❌ Defer |
| API field resolver for `agentName` | Single query; domain stays pure | New resolver pattern in API | ✅ **Chosen** |
| GraphQL-only `agentId`, UI resolves | Cleanest contract | More UI complexity | Partial — expose `agentId` + resolved `agentName` |

---

### 12.4 Data Migration: `agentName` → `agentId`

**Impact:** Existing `taskProgress` documents have `events[].agentName` containing MongoDB ObjectIds (not display names).

**No migration framework exists** in the monorepo (indexes only via `apps/api/src/bootstrap/mongoIndexes.ts`).

**Recommended approach — backward-compatible read + optional backfill script:**

1. **Read compatibility** (required): In `taskProgressFactory` or `toTaskProgressResponse`, normalize events:
   ```typescript
   agentId: event.agentId ?? event.agentName  // legacy field fallback
   ```
2. **Write path** (required): All new events write `agentId` only; stop writing `agentName`.
3. **Backfill script** (optional, run once in staging/prod):
   ```javascript
   // scripts/migrations/rename-task-progress-agent-name-to-agent-id.js
   db.taskProgress.updateMany(
     { 'events.agentName': { $exists: true } },
     [{ $set: { events: { $map: {
       input: '$events',
       as: 'e',
       in: { $mergeObjects: ['$$e', { agentId: '$$e.agentName' }] }
     }}}}]
   );
   // Second pass: $unset events.agentName (after deploy reads both fields)
   ```
4. **No new indexes required** — query patterns unchanged (`taskId` + `userId`).

**Deploy order:** Deploy read-compat code first → run backfill → deploy write-only `agentId` → optional unset legacy field.

---

### 12.5 GraphQL Schema Corrections

**File:** `domains/task-progress/src/model/graphql.ts`

**Current gaps vs. UI query (`taskProgressQuery.ts`):**

| Field | UI requests | Schema exposes | Action |
|-------|-------------|----------------|--------|
| `TaskProgress.events` | ✅ | ❌ missing | Add `events: [ProgressEvent!]!` |
| `TaskProgress.totalTokens` | ✅ | ❌ missing | Add `totalTokens: TokenUsage!` |
| `ProgressEvent.agentId` | (new) | ❌ | Add `agentId: ID!` |
| `ProgressEvent.agentName` | ✅ | ✅ (stored today) | Change to **resolved field** in API resolver |
| `ProgressEvent.tokenUsage` | ✅ | ❌ missing | Add nullable `tokenUsage: TokenUsage` |
| `ProgressEvent.errorDetails` | ✅ | ❌ missing | Add nullable `errorDetails: ErrorDetails` |

**Recommended schema shape (domain `graphql.ts`):**

```typescript
// TaskProgress — add to fields:
events: t.field({ type: [ProgressEvent], resolve: (parent) => parent.events ?? [] }),
totalTokens: t.expose('totalTokens', { type: 'TokenUsage' }),

// ProgressEvent — replace agentName expose with agentId:
agentId: t.exposeString('agentId'),
tokenUsage: t.expose('tokenUsage', { type: 'TokenUsage', nullable: true }),
errorDetails: t.expose('errorDetails', { type: 'ErrorDetails', nullable: true }),
```

**API resolver addition** — `apps/api/src/graphql/resolvers/taskProgress.ts`:

```typescript
// Register ProgressEvent.agentName field resolver (NOT in domain — cross-domain enrichment)
builder.objectField('ProgressEvent', 'agentName', (t) =>
  t.string({
    resolve: async (event, _args, context) => {
      const name = await resolveAgentDisplayName({
        agentId: event.agentId,
        userId: context.authenticatedUserId,
      });
      return name ?? 'Unknown agent';
    },
  }),
);
```

Extract `resolveAgentDisplayName` to `apps/api/src/graphql/resolvers/shared/resolveAgentDisplayName.ts`:

1. Try `systemAgentDomain.queries.getActiveById({ id: agentId })` → `data?.name`
2. If null and `userId` present, try `agentDomain.queries.getById({ id: agentId, userId })` → `data?.name` (future personal-agent tasks)
3. Return `null` if not found (resolver falls back to `'Unknown agent'`)

**Batch optimization:** For `taskProgress` query resolver, collect unique `agentId`s from `result.data.events`, resolve in parallel via `Promise.all`, attach `agentName` map before returning (avoids N+1 field resolver calls). Field resolver remains as fallback for direct `ProgressEvent` access.

**Status / state enums:** Keep domain lowercase strings in MongoDB and DTOs. Either:
- **Option A (recommended):** Expose as `String` in GraphQL (current pattern); normalize to uppercase in UI mapper only if needed for legacy components.
- **Option B:** Add GraphQL enums with resolver mapping — more ceremony, no user benefit.

---

### 12.6 Agent Display Name Resolution

**Principle:** IDs are stored; names are never written to progress events.

**Resolution layer:** API gateway (not domain — domains cannot cross-import).

```
ProgressEvent (DB)          API resolver                 GraphQL response
─────────────────          ──────────────               ──────────────────
agentId: "674a..."    →    getActiveById(agentId)  →   agentId: "674a..."
                           .name                        agentName: "Assistant"
```

**Why not domain mapper?** `@vassembly/domain-task-progress` cannot import `@vassembly/domain-system-agent` (domain isolation rule). Service-layer enrichment in a dedicated API resolver helper is the established escape hatch for cross-domain reads.

**Why not UI-only resolution?** Would require a second GraphQL query (`systemAgents` list or per-id lookup), duplicate auth scoping, and complicate `ExecutionProgressTracker` (currently a dumb consumer of `taskProgress` query). API enrichment keeps the UI package unchanged except for `agentId` in types.

**Task detail page context:** `TaskDto.agentAssignedId` remains the task-level assignment; progress events carry their own `agentId` per event (supports Phase 2 multi-agent). For Phase 1 single-agent tasks, both IDs match.

---

### 12.7 Frontend Integration — Task Detail Page

**File:** `apps/web/app/tasks/[id]/page.tsx`

Replace synthetic timeline with existing tracker:

```tsx
import { ExecutionProgressTracker } from '@vassembly/ui-execution-progress-tracker';

// Inside content column (replace TaskDetailTimeline):
<ExecutionProgressTracker taskId={view.task.id} />
```

**Remove / deprecate:**

| File | Action |
|------|--------|
| `apps/web/app/tasks/[id]/_components/TaskDetailTimeline.tsx` | Delete or keep skeleton-only wrapper |
| `apps/web/app/tasks/[id]/_components/useTaskDetailTimeline.ts` | Delete |
| `apps/web/app/tasks/[id]/lib/buildSyntheticTimelineEvents.ts` | Delete |
| `apps/web/app/tasks/[id]/_components/TaskDetailTimelineEventRow.tsx` | Delete if unused |

**Loading / empty states:**

| Scenario | Behavior |
|----------|----------|
| Task loading | Keep `TaskDetailSkeleton` (page-level) |
| Task loaded, no progress doc yet | `ExecutionProgressTracker` shows "No progress data available" until first event (existing empty state) |
| Task in-progress | Tracker polls every ~1s (existing `useProgressPolling`) |
| Task done/failed | Polling stops; events remain as static history |

**Status casing fix** — `ui/execution-progress-tracker/src/utils/normalizeTaskProgress.ts` (new):

```typescript
export const normalizeTaskProgressStatus = (status: string): TaskProgressData['status'] => {
  const map: Record<string, TaskProgressData['status']> = {
    'in-progress': 'IN_PROGRESS',
    'completed': 'COMPLETED',
    'failed': 'FAILED',
  };
  return map[status] ?? status as TaskProgressData['status'];
};
```

Apply in `useProgressPolling` when mapping Apollo `data.taskProgress` → `TaskProgressData`. Same for event `state` (`started` → `STARTED`, etc.).

**Section label:** Tracker's `ProgressHeader` already shows progress metadata; remove duplicate "Progress" heading from deleted `TaskDetailTimeline` or pass a `showHeader={false}` prop if layout requires single heading (minor UI tweak).

---

### 12.8 File-by-File Change List

#### `@vassembly/client-langchain` — token usage extraction

| File | Change |
|------|--------|
| `src/types.ts` | Add `usage?: { promptTokens; completionTokens; totalTokens? }` to `AiProviderInvokeResult` |
| `src/utils/extractTokenUsageFromMessage.ts` | **New** — read `usage_metadata` / `response_metadata.token_usage` from LangChain `AIMessage` |
| `src/utils/extractTokenUsageFromMessage.test.ts` | **New** — unit tests for OpenAI/Anthropic metadata shapes |
| `src/operations/invokeWithChatModel.ts` | Return `usage` from simple invoke and tool-call paths |
| `src/operations/runToolCallLoop.ts` | Accumulate usage across loop iterations; return `totalUsage` alongside `response` |

#### `@vassembly/domain-ai-integration` — pass usage through wrapper

| File | Change |
|------|--------|
| `src/clients/langchain.ts` | Extend `ModeledProviderClient.invoke` return type with `usage?`; forward from `client.invoke()` |

#### `@vassembly/domain-task-progress` — agentId rename + schema completion

| File | Change |
|------|--------|
| `src/model/model.ts` | `agentName` → `agentId` on `ProgressEventModel` |
| `src/model/dto.ts` | `agentId` on `ProgressEventResponse` (no `agentName` in DTO — resolver adds it) |
| `src/model/toTaskProgressResponse.ts` | Map `agentId`; legacy fallback `event.agentId ?? event.agentName` |
| `src/model/graphql.ts` | Add `events`, `totalTokens`, `agentId`, `tokenUsage`, `errorDetails`; remove stored `agentName` expose |
| `src/commands/recordProgressEvent/index.ts` | Validation: `agentId` replaces `agentName` |
| `src/commands/recordProgressEvent/types.ts` | Rename field |
| `src/commands/recordProgressEvent/index.test.ts` | Update fixtures |
| `src/commands/finalizeTaskProgress/index.test.ts` | Update `agentName` → `agentId` in fixtures |
| `src/queries/getTaskProgressByTaskId/index.test.ts` | Update fixtures |
| `README.md` | Document `agentId` contract |

#### `@vassembly/service-task` — write path fixes

| File | Change |
|------|--------|
| `src/handlers/executeTask/index.ts` | `agentId: task.agentAssignedId`; call `finalizeTaskProgress` on success (`status: 'completed'`) and in catch (`status: 'failed'`) |
| `src/handlers/executeTask/recordProgressHelper.ts` | `agentId` param |
| `src/handlers/executeTask/index.test.ts` | Assert `agentId` + `finalizeTaskProgress` called; mock usage |
| `src/handlers/recordTaskProgress/index.ts` | Validate `agentId` not `agentName` |
| `src/handlers/recordTaskProgress/types.ts` | Rename field |

#### `apps/api` — GraphQL enrichment

| File | Change |
|------|--------|
| `src/graphql/resolvers/taskProgress.ts` | Optional batch name resolution on query resolve |
| `src/graphql/resolvers/shared/resolveAgentDisplayName.ts` | **New** — system agent lookup (+ personal agent fallback) |
| `src/graphql/resolvers/shared/resolveAgentDisplayName.test.ts` | **New** |
| `src/graphql/resolvers/taskProgress.test.ts` | Add `agentId` fixtures; test `agentName` resolution |

#### `@vassembly/ui-execution-progress-tracker` — casing + query

| File | Change |
|------|--------|
| `src/graphql/taskProgressQuery.ts` | `agentName` stays (resolved); add `agentId` field |
| `src/hooks/useProgressPolling.ts` | Normalize status/state casing from API response |
| `src/utils/normalizeTaskProgress.ts` | **New** |
| `src/types.ts` | Add `agentId` to `ProgressEvent`; keep `agentName` for display |
| `src/_components/ProgressItem.tsx` | No change if normalizer handles state casing |
| `README.md` | Note lowercase API / normalized UI |

#### `apps/web` — task detail integration

| File | Change |
|------|--------|
| `app/tasks/[id]/page.tsx` | Swap `TaskDetailTimeline` → `ExecutionProgressTracker` |
| `app/tasks/[id]/_components/TaskDetailTimeline.tsx` | Delete |
| `app/tasks/[id]/_components/useTaskDetailTimeline.ts` | Delete |
| `app/tasks/[id]/lib/buildSyntheticTimelineEvents.ts` | Delete |
| `app/tasks/[id]/_components/TaskDetailTimelineEventRow.tsx` | Delete if no other consumers |
| `e2e/fixtures/taskProgress.ts` | Align mock shape: `agentId`, lowercase status, `tokenUsage.input` not `inputTokens` |
| `e2e/tests/taskProgress.integration.test.ts` | Update query fields and assertions |

#### No changes required

| Package | Reason |
|---------|--------|
| `services/agent/runAgentInvokeWithTools.ts` | Already forwards `usage: result.usage` on system path |
| `domains/system-agent/commands/invoke` | Already returns `usage: response.usage` — fixed upstream |
| `apps/api/src/bootstrap/mongoIndexes.ts` | Index definitions unchanged |

---

### 12.9 Ordered Task Breakdown (Dependencies)

```
Phase A — Token pipeline (unblocks Issue 2)
  A1. client-langchain: extractTokenUsage + invokeWithChatModel + runToolCallLoop
  A2. domain-ai-integration: forward usage in ModeledProviderClient
  A3. service-task executeTask: verify tokenUsage on completed event + wire finalizeTaskProgress

Phase B — Domain agentId rename (unblocks Issue 1)
  B1. domain-task-progress: model, commands, DTO, mapper (with legacy read fallback)
  B2. service-task: executeTask + recordTaskProgress use agentId
  B3. Optional: one-off MongoDB backfill script

Phase C — GraphQL completion (unblocks Issue 3 data fetch)
  C1. domain-task-progress graphql.ts: events, totalTokens, agentId, tokenUsage, errorDetails
  C2. apps/api: resolveAgentDisplayName + ProgressEvent.agentName field resolver
  C3. apps/api: batch name resolution in taskProgress query resolver

Phase D — UI fixes (unblocks Issues 3, 4)
  D1. ui-execution-progress-tracker: normalizeTaskProgress + query agentId
  D2. apps/web task detail: wire ExecutionProgressTracker, remove synthetic timeline
  D3. E2E fixture alignment

Deploy: A → B → C → D (B and A can run in parallel; C depends on B; D depends on C)
```

---

### 12.10 Test Updates

| Package | Test file | Updates |
|---------|-----------|---------|
| `client-langchain` | `extractTokenUsageFromMessage.test.ts` | **New** — OpenAI `usage_metadata`, Anthropic `input_tokens`/`output_tokens`, missing metadata → undefined |
| `client-langchain` | `invokeWithChatModel.test.ts` | Assert `usage` present when metadata mocked |
| `domain-ai-integration` | `langchain.test.ts` (if exists) or add | Assert usage forwarded through wrapper |
| `domain-task-progress` | `recordProgressEvent/index.test.ts` | `agentId` validation; reject empty `agentId` |
| `domain-task-progress` | `finalizeTaskProgress/index.test.ts` | `agentId` fixtures; token aggregation unchanged |
| `domain-task-progress` | `getTaskProgressByTaskId/index.test.ts` | Legacy `agentName` fallback in mapper |
| `service-task` | `executeTask/index.test.ts` | `agentId` on record calls; `finalizeTaskProgress` on complete/fail; `tokenUsage` when usage mocked |
| `service-task` | `recordTaskProgress/index.test.ts` | `agentId` required field |
| `apps/api` | `resolvers/taskProgress.test.ts` | `agentName` resolved from mocked `getActiveById` |
| `apps/api` | `resolveAgentDisplayName.test.ts` | **New** — system agent found, not found, personal agent fallback |
| `ui-execution-progress-tracker` | `normalizeTaskProgress.test.ts` | **New** — lowercase → uppercase mapping |
| `ui-execution-progress-tracker` | `useProgressPolling.test.ts` (if exists) | Polling stops on `completed`/`failed` |
| `apps/web` | `e2e/tests/taskProgress.integration.test.ts` | `agentId` in query; lowercase status in mocks |
| `apps/web` | `e2e/fixtures/taskProgress.ts` | Align field names with domain DTO |

**Regression checks (manual QA):**

1. Create task → task detail shows live progress events within ~1s
2. Completed event shows token counts matching provider response
3. Agent displays "Assistant" (or current name), not ObjectId
4. Page refresh shows persisted progress history
5. Polling stops when task status is `done` or `failed`

---

### 12.11 Todo Plan (Delegation)

1. **`@vassembly/client-langchain`** — [Type: utility extension]
   - Changes: Token usage extraction from LangChain messages; aggregate in tool loop
   - Files: `src/types.ts`, `src/utils/extractTokenUsageFromMessage.ts`, `src/operations/invokeWithChatModel.ts`, `src/operations/runToolCallLoop.ts`
   - Workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (max 2) → `documentation-writer`
   - Dependencies: None

2. **`@vassembly/domain-ai-integration`** — [Type: domain extension]
   - Changes: Forward `usage` through `ModeledProviderClient`
   - Files: `src/clients/langchain.ts`
   - Workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (max 2)
   - Dependencies: Todo 1

3. **`@vassembly/domain-task-progress`** — [Type: domain extension]
   - Changes: `agentName` → `agentId`; complete GraphQL schema fields; legacy read fallback
   - Files: `src/model/*`, `src/commands/recordProgressEvent/*`, `src/commands/finalizeTaskProgress/*.test.ts`, `README.md`
   - Workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (max 2) → `documentation-writer`
   - Dependencies: None (parallel with Todo 1)

4. **`@vassembly/service-task`** — [Type: service extension]
   - Changes: `agentId` writes; wire `finalizeTaskProgress`; verify tokenUsage persistence
   - Files: `src/handlers/executeTask/*`, `src/handlers/recordTaskProgress/*`
   - Workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (max 2)
   - Dependencies: Todos 1, 2, 3

5. **`apps/api`** — [Type: API gateway extension]
   - Changes: Complete schema registration; `resolveAgentDisplayName`; `ProgressEvent.agentName` field resolver
   - Files: `src/graphql/resolvers/taskProgress.ts`, `src/graphql/resolvers/shared/resolveAgentDisplayName.ts`
   - Workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (max 2)
   - Dependencies: Todo 3

6. **`@vassembly/ui-execution-progress-tracker`** — [Type: UI package extension]
   - Changes: Status/state normalizer; add `agentId` to query and types
   - Files: `src/utils/normalizeTaskProgress.ts`, `src/hooks/useProgressPolling.ts`, `src/graphql/taskProgressQuery.ts`, `src/types.ts`
   - Workflow: `tdd-unit-test-writer` → `coder` ↔ `code-reviewer` (max 2) → `documentation-writer`
   - Dependencies: Todo 5

7. **`apps/web`** — [Type: app / E2E]
   - Changes: Wire `ExecutionProgressTracker` on task detail; remove synthetic timeline; update E2E fixtures
   - Files: `app/tasks/[id]/page.tsx`, delete synthetic timeline files, `e2e/fixtures/taskProgress.ts`, `e2e/tests/taskProgress.integration.test.ts`
   - Workflow: `tdd-e2e-test-writer` → `coder` ↔ `code-reviewer` (max 2)
   - Dependencies: Todos 4, 5, 6

8. **Data backfill (optional)** — [Type: ops script]
   - Changes: One-off script to rename `events[].agentName` → `events[].agentId`
   - Files: `scripts/migrations/rename-task-progress-agent-name-to-agent-id.js` (new)
   - Workflow: `coder` → Done
   - Dependencies: Todo 3 deployed with read fallback

---

**End of Architecture Implementation Plan**

Document prepared for: Engineering team  
Ready for implementation: Immediate  
Next review: Post-fix QA round
