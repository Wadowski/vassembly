import type { Page } from '@playwright/test';

/**
 * Mock TaskProgress data for testing
 * Follows the backend TaskProgress schema from domain-task-progress
 */

export interface MockTokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface MockProgressEvent {
  id: string;
  agentId: string;
  agentName: string;
  parentAgentId?: string;
  state: 'STARTED' | 'COMPLETED' | 'FAILED';
  timestamp: string;
  duration?: number;
  tokenUsage?: MockTokenUsage;
  inputMessages?: string;
  generatedResponse?: string;
  errorDetails?: {
    message: string;
    type?: string;
    stackTrace?: string;
  };
}

export interface MockTaskProgress {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  completedAt?: string | null;
  totalDuration?: number;
  totalTokens?: MockTokenUsage;
  events: MockProgressEvent[];
}

/**
 * Create a mock progress event for testing
 */
export const createMockProgressEvent = (
  overrides?: Partial<MockProgressEvent>
): MockProgressEvent => {
  const baseTime = new Date(Date.now() - 5 * 60_000);

  return {
    id: `evt-${Math.random().toString(36).substr(2, 9)}`,
    agentId: `agent-${Math.random().toString(36).substr(2, 6)}`,
    agentName: 'Test Agent',
    state: 'STARTED',
    timestamp: baseTime.toISOString(),
    duration: 1000,
    tokenUsage: {
      input: 150,
      output: 280,
      total: 430,
    },
    ...overrides,
  };
};

/**
 * Create multiple mock progress events with sequential timestamps
 */
export const createMockProgressEvents = (count: number): MockProgressEvent[] => {
  const events: MockProgressEvent[] = [];
  const baseTime = new Date(Date.now() - count * 60_000);

  for (let i = 0; i < count; i++) {
    const eventTime = new Date(baseTime.getTime() + i * 60_000);
    const states: Array<'STARTED' | 'COMPLETED' | 'FAILED'> = ['STARTED', 'COMPLETED', 'FAILED'];

    events.push(
      createMockProgressEvent({
        id: `evt-${i + 1}`,
        agentId: `agent-${i + 1}`,
        agentName: `Agent ${i + 1}`,
        parentAgentId: i > 0 ? 'agent-1' : undefined,
        state: states[i % states.length],
        timestamp: eventTime.toISOString(),
        duration: 2000 + Math.random() * 3000,
        tokenUsage: {
          input: 100 + Math.floor(Math.random() * 200),
          output: 200 + Math.floor(Math.random() * 300),
          total: 300 + Math.floor(Math.random() * 500),
        },
      })
    );
  }

  return events;
};

/**
 * Create a mock TaskProgress document for testing
 */
export const createMockTaskProgress = (
  overrides?: Partial<MockTaskProgress>
): MockTaskProgress => {
  const events = createMockProgressEvents(3);

  const totalTokens = events.reduce(
    (acc, event) => {
      const usage = event.tokenUsage;
      if (!usage) {
        return acc;
      }
      return {
        input: acc.input + usage.input,
        output: acc.output + usage.output,
        total: acc.total + usage.total,
      };
    },
    { input: 0, output: 0, total: 0 }
  );

  return {
    id: `prog-${Math.random().toString(36).substr(2, 9)}`,
    taskId: `task-${Math.random().toString(36).substr(2, 9)}`,
    userId: `user-${Math.random().toString(36).substr(2, 9)}`,
    startedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    completedAt: null,
    totalDuration: events.reduce((sum, event) => sum + (event.duration ?? 0), 0),
    totalTokens,
    events,
    ...overrides,
  };
};

/**
 * Mock GraphQL response for taskProgress query
 */
export const mockTaskProgressQuery = (taskProgress: MockTaskProgress) => ({
  data: {
    taskProgress,
  },
});

/**
 * Setup mock GraphQL response for Playwright page
 */
export const setupMockTaskProgressPolling = async (
  page: Page,
  _taskProgress: MockTaskProgress
): Promise<void> => {
  await page.route('**/graphql', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    if (postData?.operationName?.includes('taskProgress') || postData?.query?.includes('taskProgress')) {
      await route.abort();
      return;
    }

    await route.continue();
  });
};

/**
 * Simulate task completion by setting completedAt and appending a final event
 */
export const completeMockTask = (taskProgress: MockTaskProgress): MockTaskProgress => {
  const finalEvent = createMockProgressEvent({
    id: 'evt-final',
    agentName: 'Task Orchestrator',
    state: 'COMPLETED',
    timestamp: new Date().toISOString(),
    duration: 0,
    tokenUsage: { input: 10, output: 20, total: 30 },
  });

  const events = [...taskProgress.events, finalEvent];
  const totalTokens = events.reduce(
    (acc, event) => {
      const usage = event.tokenUsage;
      if (!usage) {
        return acc;
      }
      return {
        input: acc.input + usage.input,
        output: acc.output + usage.output,
        total: acc.total + usage.total,
      };
    },
    { input: 0, output: 0, total: 0 }
  );

  return {
    ...taskProgress,
    completedAt: new Date().toISOString(),
    totalTokens,
    events,
  };
};

/**
 * Simulate API error response
 */
export const createMockErrorResponse = (
  errorMessage: string = 'Internal Server Error',
  errorCode: string = 'GRAPHQL_ERROR'
) => ({
  errors: [
    {
      message: errorMessage,
      extensions: {
        code: errorCode,
      },
    },
  ],
});

/**
 * Simulate polling intervals for testing
 */
export const createPollingSequence = (
  baseProgress: MockTaskProgress,
  intervalMs: number = 1000,
  durationMs: number = 10_000
): Array<{ delay: number; progress: MockTaskProgress }> => {
  const sequence: Array<{ delay: number; progress: MockTaskProgress }> = [];
  const intervals = Math.floor(durationMs / intervalMs);

  for (let i = 0; i < intervals; i++) {
    const delay = i * intervalMs;
    const newEvent = createMockProgressEvent({
      id: `evt-seq-${i}`,
      timestamp: new Date(Date.now() + delay).toISOString(),
      tokenUsage: { input: 50, output: 100, total: 150 },
    });

    const isFinal = i === intervals - 1;

    sequence.push({
      delay,
      progress: {
        ...baseProgress,
        events: [...baseProgress.events, newEvent],
        completedAt: isFinal ? new Date().toISOString() : null,
      },
    });
  }

  return sequence;
};

/**
 * Helper to verify event ordering
 */
export const verifyEventOrder = (events: MockProgressEvent[]): boolean => {
  for (let i = 1; i < events.length; i++) {
    const prevTime = new Date(events[i - 1].timestamp).getTime();
    const currTime = new Date(events[i].timestamp).getTime();

    if (currTime < prevTime) {
      return false;
    }
  }

  return true;
};

/**
 * Helper to calculate relative time for testing
 */
export const calculateRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const eventTime = new Date(timestamp);
  const diffMs = now.getTime() - eventTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return `${diffSeconds} seconds ago`;
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

/**
 * Test fixture data preset: Successful task with 5 events
 */
export const FIXTURE_SUCCESSFUL_TASK_5_EVENTS: MockTaskProgress = createMockTaskProgress({
  taskId: 'task-success-5',
  completedAt: new Date().toISOString(),
  events: createMockProgressEvents(5),
});

/**
 * Test fixture data preset: In-progress task with 3 events
 */
export const FIXTURE_IN_PROGRESS_TASK_3_EVENTS: MockTaskProgress = createMockTaskProgress({
  taskId: 'task-progress-3',
  completedAt: null,
  events: createMockProgressEvents(3),
});

/**
 * Test fixture data preset: Failed task with error event
 */
export const FIXTURE_FAILED_TASK: MockTaskProgress = createMockTaskProgress({
  taskId: 'task-failed',
  completedAt: new Date().toISOString(),
  events: [
    createMockProgressEvent({
      id: 'evt-fail-1',
      state: 'STARTED',
    }),
    createMockProgressEvent({
      id: 'evt-fail-2',
      state: 'FAILED',
      errorDetails: {
        message: 'LLM API timeout',
        type: 'TIMEOUT',
      },
    }),
  ],
});

/**
 * Test fixture data preset: Empty task (no events yet)
 */
export const FIXTURE_EMPTY_TASK: MockTaskProgress = createMockTaskProgress({
  taskId: 'task-empty',
  completedAt: null,
  events: [],
});
