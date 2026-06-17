import type { Page, Route } from '@playwright/test';
import type { MockTaskProgress, MockProgressEvent } from './taskProgress';
import {
  createMockTaskProgress,
  createMockProgressEvents,
  createMockErrorResponse,
} from './taskProgress';

/**
 * Integration fixture: Setup task with N progress events in database
 * (In real scenario, this would seed MongoDB. For testing, we mock GraphQL responses)
 */
export const setupTaskWithEvents = async (count: number): Promise<MockTaskProgress> => {
  const events = createMockProgressEvents(count);
  return createMockTaskProgress({
    events,
  });
};

/**
 * Integration fixture: Mock GraphQL response for specific taskProgress data
 * Sets up Playwright route interception to return mock data
 */
export const mockGraphQLResponse = async (
  page: Page,
  taskProgress: MockTaskProgress,
  options: {
    delay?: number;
    shouldFail?: boolean;
    failureCode?: string;
  } = {}
): Promise<void> => {
  const { delay = 0, shouldFail = false } = options;

  await page.route('**/graphql', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();

    // Check if this is a taskProgress query
    if (
      postData?.operationName?.includes('TaskProgress') ||
      postData?.query?.includes('taskProgress')
    ) {
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (shouldFail) {
        await route.abort('failed');
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            taskProgress,
          },
        }),
      });
      return;
    }

    await route.continue();
  });
};

/**
 * Integration fixture: Track polling request metrics
 * Monitors timing and count of GraphQL requests
 */
export interface PollingMetrics {
  requestCount: number;
  requestTimestamps: number[];
  intervals: number[];
  averageInterval: number;
  lastRequestTime: number;
}

export const getPollingMetrics = async (page: Page): Promise<PollingMetrics> => {
  const metrics: PollingMetrics = {
    requestCount: 0,
    requestTimestamps: [],
    intervals: [],
    averageInterval: 0,
    lastRequestTime: 0,
  };

  const timestamps: number[] = [];

  await page.on('request', (request) => {
    const url = request.url();
    const postData = request.postDataJSON?.();

    if (
      url.includes('graphql') &&
      postData?.operationName?.includes('TaskProgress')
    ) {
      const now = Date.now();
      timestamps.push(now);

      if (timestamps.length > 1) {
        const interval = now - timestamps[timestamps.length - 2];
        metrics.intervals.push(interval);
      }
    }
  });

  metrics.requestCount = timestamps.length;
  metrics.requestTimestamps = timestamps;
  metrics.lastRequestTime = timestamps[timestamps.length - 1] ?? 0;

  if (metrics.intervals.length > 0) {
    metrics.averageInterval =
      metrics.intervals.reduce((a, b) => a + b, 0) / metrics.intervals.length;
  }

  return metrics;
};

/**
 * Integration fixture: Simulate API error in next N requests
 * Sets up route to fail with specified error for a limited time
 */
export const simulateAPIError = async (
  page: Page,
  options: {
    failureCount?: number;
    errorCode?: string;
    errorMessage?: string;
  } = {}
): Promise<{
  failedCount: number;
  reset: () => Promise<void>;
}> => {
  const {
    failureCount = 1,
    errorCode = 'INTERNAL_SERVER_ERROR',
    errorMessage = 'Internal server error',
  } = options;

  let failedRequests = 0;

  const failureHandler = async (route: Route) => {
    const request = route.request();
    const postData = request.postDataJSON?.();

    if (
      (postData?.operationName?.includes('TaskProgress') ||
        postData?.query?.includes('taskProgress')) &&
      failedRequests < failureCount
    ) {
      failedRequests++;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify(
          createMockErrorResponse(errorMessage, errorCode)
        ),
      });
      return;
    }

    await route.continue();
  };

  await page.route('**/graphql', failureHandler);

  return {
    failedCount: failedRequests,
    reset: async () => {
      await page.unroute('**/graphql');
      failedRequests = 0;
    },
  };
};

/**
 * Integration fixture: Wait for polling to recover from error state
 * Waits until polling resumes with normal interval
 */
export const waitForPollingRecovery = async (
  page: Page,
  options: {
    normalInterval?: number;
    timeout?: number;
    tolerance?: number;
  } = {}
): Promise<{
  recovered: boolean;
  recoveryTime: number;
  finalInterval: number;
}> => {
  const {
    normalInterval = 1000,
    timeout = 30000,
    tolerance = 50,
  } = options;

  const startTime = Date.now();
  let recovered = false;
  let finalInterval = 0;

  const checkRecovery = async (): Promise<boolean> => {
    const metrics = await getPollingMetrics(page);

    if (metrics.intervals.length >= 2) {
      const recentIntervals = metrics.intervals.slice(-2);
      const avgRecentInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;

      if (
        Math.abs(avgRecentInterval - normalInterval) <= tolerance
      ) {
        finalInterval = avgRecentInterval;
        return true;
      }
    }

    return false;
  };

  while (Date.now() - startTime < timeout && !recovered) {
    if (await checkRecovery()) {
      recovered = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const recoveryTime = Date.now() - startTime;

  return {
    recovered,
    recoveryTime,
    finalInterval,
  };
};

/**
 * Integration fixture: Verify response shape matches expected contract
 * Validates GraphQL response structure and types
 */
export const verifyTaskProgressResponseShape = (data: {
  taskProgress?: {
    id?: string;
    taskId?: string;
    startedAt?: string;
    completedAt?: string | null;
    events?: Array<Record<string, unknown>>;
  };
}): boolean => {
  if (!data?.taskProgress) return false;

  const taskProgress = data.taskProgress;

  const requiredFields = ['id', 'taskId', 'startedAt', 'events'];
  const allFieldsPresent = requiredFields.every(
    (field) => field in taskProgress
  );

  if (!allFieldsPresent) return false;

  if (!('completedAt' in taskProgress)) return false;

  if (!Array.isArray(taskProgress.events)) return false;

  // Validate event shape
  const eventFieldsRequired = ['id', 'agentName', 'state', 'timestamp'];
  const allEventsValid = taskProgress.events.every((event) =>
    eventFieldsRequired.every((field) => field in event)
  );

  return allEventsValid;
};

/**
 * Integration fixture: Verify event ordering (chronological)
 * Ensures events are sorted by timestamp (oldest first)
 */
export const verifyEventChronologicalOrder = (events: MockProgressEvent[]): boolean => {
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
 * Integration fixture: Verify no duplicate events in list
 */
export const verifyNoDuplicateEvents = (
  events: MockProgressEvent[]
): boolean => {
  const ids = new Set<string>();

  for (const event of events) {
    if (ids.has(event.id)) {
      return false;
    }
    ids.add(event.id);
  }

  return true;
};

/**
 * Integration fixture: Wait for new event to appear in polling response
 */
export const waitForNewEventInPolling = async (
  page: Page,
  initialEventCount: number,
  options: {
    timeout?: number;
    pollCheckInterval?: number;
  } = {}
): Promise<{
  found: boolean;
  finalEventCount: number;
  timeElapsed: number;
}> => {
  const { timeout = 10000, pollCheckInterval = 500 } = options;

  const startTime = Date.now();
  let found = false;
  let finalEventCount = initialEventCount;

  while (Date.now() - startTime < timeout && !found) {
    // Check for new events by counting list items
    const eventCount = await page.locator('[data-testid="progress-event"]').count();

    if (eventCount > initialEventCount) {
      finalEventCount = eventCount;
      found = true;
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, pollCheckInterval));
  }

  const timeElapsed = Date.now() - startTime;

  return {
    found,
    finalEventCount,
    timeElapsed,
  };
};

/**
 * Integration fixture: Verify polling timing tolerance
 * Checks if polling requests occur within expected interval ±tolerance
 */
export const verifyPollingTiming = (
  intervals: number[],
  expectedInterval: number,
  tolerance: number = 50
): {
  isValid: boolean;
  violations: Array<{ interval: number; expected: number; tolerance: number }>;
} => {
  const violations: Array<{
    interval: number;
    expected: number;
    tolerance: number;
  }> = [];

  for (const interval of intervals) {
    if (Math.abs(interval - expectedInterval) > tolerance) {
      violations.push({
        interval,
        expected: expectedInterval,
        tolerance,
      });
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
};
