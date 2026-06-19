# @vassembly/domain-task-progress

Core domain package for real-time task execution progress tracking. Manages task progress documents, progress events, and event aggregation for the Real-Time Agent Execution Progress Tracker feature.

## Features

- **TaskProgress Management**: Create and manage progress tracking documents per task
- **Event Recording**: Atomically append execution events (started, completed, failed) to progress documents
- **Progress Finalization**: Calculate aggregated metrics (total duration, token counts) when tasks complete
- **GraphQL Integration**: Built-in GraphQL schema for progress queries
- **MongoDB Persistence**: Optimized indexing for fast taskId + userId lookups

## Exports

### Models & Types

- `TaskProgressModel` — Domain entity for task progress
- `ProgressEventModel` — Individual execution event within a task
- `TaskProgressStatus` — Enum: 'in-progress', 'completed', 'failed'
- `ProgressEventState` — Enum: 'started', 'completed', 'failed'
- `TokenUsage` — Token consumption tracking
- `ErrorDetails` — Error information for failed events
- `TaskProgressResponse` — DTO returned to clients (with ISO 8601 dates)
- `ProgressEventResponse` — Event DTO for API responses

### Commands

- `initializeTaskProgress(input)` — Create new task progress document (idempotent)
  - Input: `{ taskId: string; userId: string }`
  - Returns: `TaskProgressModel`

- `recordProgressEvent(input)` — Append event to task progress events array (atomic $push)
  - Input: `{ taskId, agentName, state, timestamp?, duration?, inputMessages?, generatedResponse?, tokenUsage?, errorDetails? }`
  - Returns: `ProgressEventModel`

- `finalizeTaskProgress(input)` — Mark task as completed/failed and calculate metrics
  - Input: `{ taskId: string; status?: 'completed' | 'failed' }`
  - Returns: `TaskProgressModel`

### Queries

- `getTaskProgressByTaskId(input)` — Public query: fetch progress document with auth validation
  - Input: `{ taskId: string; userId: string }`
  - Returns: `{ data: TaskProgressResponse | null }`
  - Validates user ownership; throws `ForbiddenError` if unauthorized

- `getModelByTaskId(input)` — Internal query: fetch progress document as model
  - Input: `{ taskId: string }`
  - Returns: `{ data: TaskProgressModel | null }`
  - Used by commands and internal operations (no DTO mapping)

### Utilities

- `mongodbIndexes()` — Initialize MongoDB indexes for fast queries
  - Creates compound index: `(taskId, userId)`
  - Creates index: `(userId, createdAt)`

## Data Structures

### TaskProgressModel

```typescript
{
  id: string;
  taskId: string;
  userId: string;
  createdAt: Date;
  startedAt: Date;
  completedAt: Date | null;
  status: 'in-progress' | 'completed' | 'failed';
  events: ProgressEventModel[];
  totalDuration: number; // milliseconds
  totalTokens: { input: number; output: number; total: number };
}
```

### ProgressEventModel

```typescript
{
  id: string;
  agentName: string;
  state: 'started' | 'completed' | 'failed';
  timestamp: Date;
  duration?: number; // milliseconds
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: { input: number; output: number; total: number };
  errorDetails?: { message: string; type?: string; stackTrace?: string };
  parentAgentId?: string; // For Phase 2: nested agents
  childAgentIds?: string[];
}
```

## MongoDB Schema

Collection: `taskProgress`

```json
{
  "_id": ObjectId,
  "taskId": string,
  "userId": string,
  "createdAt": Date,
  "startedAt": Date,
  "completedAt": Date | null,
  "status": "in-progress" | "completed" | "failed",
  "events": [
    {
      "_id": ObjectId,
      "agentName": string,
      "state": "started" | "completed" | "failed",
      "timestamp": Date,
      "duration": number,
      "inputMessages": string,
      "generatedResponse": string,
      "tokenUsage": { "input": number, "output": number, "total": number },
      "errorDetails": { "message": string, "type": string, "stackTrace": string }
    }
  ],
  "totalDuration": number,
  "totalTokens": { "input": number, "output": number, "total": number }
}
```

Indexes:
- `(taskId, userId)` — Primary compound index for polling queries
- `(userId, createdAt)` — Secondary index for user-scoped listing

## Usage

### Initialize Progress on Task Start

```typescript
import taskProgressDomain from '@vassembly/domain-task-progress';

const progress = await taskProgressDomain.commands.initializeTaskProgress({
  taskId: 'task-123',
  userId: 'user-456',
});
```

### Record Agent Events

```typescript
const event = await taskProgressDomain.commands.recordProgressEvent({
  taskId: 'task-123',
  agentName: 'Intent Classifier',
  state: 'started',
  timestamp: new Date(),
  inputMessages: JSON.stringify({ prompt: 'Analyze this' }),
});

// Later, on agent completion
const completedEvent = await taskProgressDomain.commands.recordProgressEvent({
  taskId: 'task-123',
  agentName: 'Intent Classifier',
  state: 'completed',
  timestamp: new Date(),
  duration: 1250, // milliseconds
  generatedResponse: 'Intent: ANALYSIS',
  tokenUsage: { input: 45, output: 12, total: 57 },
});
```

### Finalize on Task Completion

```typescript
const finalized = await taskProgressDomain.commands.finalizeTaskProgress({
  taskId: 'task-123',
  status: 'completed',
});
// Automatically calculates totalDuration and totalTokens
```

### Fetch Progress with Auth

```typescript
const result = await taskProgressDomain.queries.getTaskProgressByTaskId({
  taskId: 'task-123',
  userId: 'user-456', // Used for auth validation
});

if (result.data) {
  console.log(`Task has ${result.data.events.length} events`);
  console.log(`Total tokens: ${result.data.totalTokens.total}`);
}
```

### Internal Usage (by Commands)

```typescript
const model = await taskProgressDomain.queries.getModelByTaskId({
  taskId: 'task-123',
});
// Returns raw model, no DTO mapping
```

## Error Handling

- **`NotFoundError`**: Task progress document doesn't exist (for append operations)
- **`ForbiddenError`**: User doesn't own the task progress (auth validation)
- **`ValidationError`**: Invalid input parameters (from Zod schema)

All errors are thrown using `@vassembly/errors` package for consistent handling across services.

## GraphQL Integration

The domain exports `gqlTaskProgressSchema` with types:

```graphql
type TaskProgress {
  id: ID!
  taskId: ID!
  status: String!
  startedAt: DateTime!
  completedAt: DateTime
  totalDuration: Int!
  totalTokens: TokenUsage!
  events: [ProgressEvent!]!
}

type ProgressEvent {
  id: ID!
  agentName: String!
  state: String!
  timestamp: DateTime!
  duration: Int
  inputMessages: String
  generatedResponse: String
  tokenUsage: TokenUsage
  errorDetails: ErrorDetails
}

type TokenUsage {
  input: Int!
  output: Int!
  total: Int!
}

type ErrorDetails {
  message: String!
  type: String
  stackTrace: String
}
```

Resolver implementations are handled by the API Gateway (`apps/api`).

## Architecture Notes

### Why Separate Commands?

Each command encapsulates a specific operation:
- **Initialize**: Ensures idempotent creation (won't duplicate if called twice)
- **Record Event**: Atomic append using MongoDB `$push` to prevent race conditions
- **Finalize**: Aggregates metrics in a single write operation

This design ensures atomic, failure-safe operations during concurrent task execution.

### Query Return Types

- **`getTaskProgressByTaskId`**: Returns DTO (mapped, ISO 8601 dates) — for external consumers and GraphQL responses
- **`getModelByTaskId`**: Returns Model (unmapped) — for internal commands and operations

This split maintains clean boundaries between public API and internal logic layers.

### Date Serialization

- **Internal models**: Store `Date` objects
- **DTOs**: Serialize to ISO 8601 strings (handled by `toTaskProgressResponse` mapper)
- **Border**: Serialization happens at query boundary before returning to external callers

## Testing

Run tests with:

```bash
npm test
npm test:watch
```

Tests are colocated with implementations (`.test.ts` suffix). Use black-box testing: validate inputs produce expected outputs, not internal implementation details.

## Dependencies

- `@vassembly/model` — Base Model class
- `@vassembly/commands` — Command helpers (if extended)
- `@vassembly/queries` — Query helpers (if extended)
- `@vassembly/client-mongodb` — MongoDB DAO abstraction
- `@vassembly/mappers` — DTO mapping utilities
- `@vassembly/errors` — Standardized error classes
- `@vassembly/graphql` — GraphQL schema builders
- `zod` — Input validation schemas

## Future Enhancements (Phase 2)

- **Nested Agents**: Support hierarchical event relationships via `parentAgentId` / `childAgentIds`
- **Event Archival**: Auto-archive old events to separate collection after 1000+ event threshold
- **Event Filtering**: Query-level filtering by state, agent name, time range
- **WebSocket Support**: Real-time push updates instead of polling
