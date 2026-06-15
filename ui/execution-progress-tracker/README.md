# @vassembly/ui-execution-progress-tracker

Real-time execution progress tracking UI component for Vassembly. Displays agent execution events, token usage, and detailed progress information in a modern, accessible interface.

## Features

- **Real-time Progress Polling**: Subscribes to task progress updates via GraphQL with configurable polling interval
- **Event List**: Displays all execution events with status indicators, duration, and token usage
- **Detail Modal**: Glassmorphic modal showing comprehensive event details including metadata, tokens, errors, and JSON payloads
- **Responsive Design**: Mobile-first design supporting all screen sizes (320px–4K)
- **Accessibility**: Full ARIA support, keyboard navigation (ESC to close), focus management, and live regions
- **Performance**: Memoized components, lazy modal rendering, efficient state management

## Installation

```bash
npm install @vassembly/ui-execution-progress-tracker
# or
pnpm add @vassembly/ui-execution-progress-tracker
```

## Usage

### Basic Example

```tsx
import { ExecutionProgressTracker } from '@vassembly/ui-execution-progress-tracker';

export const TaskDetail = ({ taskId }: { taskId: string }) => {
  const handleTaskCompleted = (progress) => {
    console.log('Task completed:', progress);
  };

  return (
    <ExecutionProgressTracker
      taskId={taskId}
      onTaskCompleted={handleTaskCompleted}
    />
  );
};
```

### Props

#### ExecutionProgressTracker

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `taskId` | `string` | Yes | ID of the task to track |
| `userId` | `string` | No | Optional user ID (for authorization) |
| `onTaskCompleted` | `(data: TaskProgressData) => void` | No | Callback when task completes or fails |

## Components

### ExecutionProgressTracker
Main container component that manages polling, state, and child components.

### ProgressHeader
Displays task metadata: status, start time, duration, and total tokens.

### ProgressList
Renders a scrollable list of execution events.

### ProgressItem
Individual event row showing agent name, status, duration, and inline token usage.

### ProgressDetailModal
Glassmorphic modal with complete event details (glassmorphism design per design spec).

### TokenUsageWidget
Displays input, output, and total token counts with formatting.

## Hooks

### useProgressPolling
```tsx
const { data, error, isLoading, refetch } = useProgressPolling({
  taskId: 'task-123',
  enabled: true, // Start/stop polling
});
```

**Features:**
- GraphQL polling with configurable interval (default 1000ms)
- Automatic stop when task completes or fails
- Refetch capability for manual updates
- Network-only fetch policy

### useModalState
```tsx
const { isOpen, selectedEventId, openModal, closeModal, triggerRef } = useModalState({
  onClose: () => console.log('Modal closed'),
});
```

**Features:**
- Modal open/close state management
- Focus trap and keyboard handling (ESC key)
- Focus restoration to trigger element on close

### useRelativeTime
```tsx
const { relativeTime } = useRelativeTime(new Date());
```

**Features:**
- Formats dates to relative time ("2m ago", "3h ago")
- Auto-updates on configurable interval (60s default)
- Cleanup on unmount

### useProgressData
```tsx
const { totalDuration, totalTokens } = useProgressData(events);
```

**Features:**
- Aggregates metrics from event array
- Memoized calculations for performance
- Returns total duration and token counts

## Utilities

### formatDuration
Converts milliseconds to human-readable format.
```tsx
formatDuration(8500) // "8m 34s"
formatDuration(500) // "500ms"
```

### formatTokens
Formats token counts with locale-specific separators.
```tsx
formatTokens(1234) // "1,234"
```

### sortEventsByTimestamp
Sorts events chronologically by timestamp.

### calculateMetrics
Aggregates duration and token usage across event array.

## Types

```tsx
interface TaskProgressData {
  id: string;
  taskId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  completedAt: Date | null;
  totalDuration: number;
  totalTokens: TokenUsage;
  events: ProgressEvent[];
}

interface ProgressEvent {
  id: string;
  agentName: string;
  state: 'STARTED' | 'COMPLETED' | 'FAILED';
  timestamp: Date;
  duration: number | null;
  inputMessages: string | null;
  generatedResponse: string | null;
  tokenUsage: TokenUsage | null;
  errorDetails: ErrorDetails | null;
}

interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

interface ErrorDetails {
  message: string;
  type: string;
  stackTrace?: string;
}
```

## Styling

The component uses CSS modules with BEM naming conventions. All styles support CSS custom properties for theming:

- `--surface`: Background surface color
- `--surface-container`: Container background
- `--surface-variant`: Variant surface color
- `--primary`: Primary brand color
- `--primary-container`: Primary container background
- `--primary-dark`: Darker primary for hover states
- `--success`: Success state color (green)
- `--error`: Error state color (red)
- `--warning`: Warning state color (orange)
- `--outline-variant`: Border/outline color
- `--on-surface-variant`: Text color for variant surfaces

## Responsive Breakpoints

- **Mobile**: 320–767px
- **Tablet**: 768–1023px
- **Desktop**: 1024px+

All components adapt gracefully across breakpoints.

## Accessibility

- Full ARIA labels on interactive elements
- Keyboard navigation: ESC to close modal
- Focus management and restoration
- Live regions for status updates
- High contrast badge colors
- Semantic HTML structure

## Performance Considerations

- `ProgressItem` uses `React.memo` to prevent unnecessary re-renders
- `useProgressData` uses `useMemo` for aggregation calculations
- Modal content lazy-loads on demand
- Polling stops automatically when task completes
- Efficient event sorting and filtering

## GraphQL Query

The component uses the following GraphQL query (exposed via `TASK_PROGRESS_QUERY`):

```graphql
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
```

## Constants

Available polling configuration constants:

```tsx
import {
  POLLING_INTERVAL_MS, // 1000ms
  POLLING_TIMEOUT_MS, // 500ms
  POLLING_MAX_WAIT_MS, // 300000ms
  POLLING_RETRY_DELAYS, // [1000, 2000, 5000]
} from '@vassembly/ui-execution-progress-tracker';
```

## Testing

All components support full test coverage:

```tsx
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ExecutionProgressTracker } from '@vassembly/ui-execution-progress-tracker';

test('displays progress events', () => {
  render(
    <MockedProvider>
      <ExecutionProgressTracker taskId="task-123" />
    </MockedProvider>
  );
  
  expect(screen.getByRole('region', { name: /progress events list/i })).toBeInTheDocument();
});
```

## License

MIT
