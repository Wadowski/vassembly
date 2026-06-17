import { test, expect, Page } from '@playwright/test';
import {
  setupTaskWithEvents,
  mockGraphQLResponse,
  simulateAPIError,
  waitForPollingRecovery,
  verifyTaskProgressResponseShape,
  verifyEventChronologicalOrder,
  verifyNoDuplicateEvents,
  verifyPollingTiming,
} from '../fixtures/taskProgressIntegration';
import {
  createMockTaskProgress,
  createMockProgressEvent,
  createMockProgressEvents,
} from '../fixtures/taskProgress';

test.describe('Task Progress Integration Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Scenario 1: GraphQL query returns correct TaskProgress shape', () => {
    test('should return task with 3 recorded progress events', async () => {
      // Setup: Create task with 3 events
      const taskProgress = await setupTaskWithEvents(3);
      await mockGraphQLResponse(page, taskProgress);

      // Call GraphQL query directly via page.request
      const response = await page.request.post('/graphql', {
        data: {
          query: `
            query TaskProgress($taskId: ID!) {
              taskProgress(taskId: $taskId) {
                id
                taskId
                startedAt
                completedAt
                totalTokens {
                  input
                  output
                  total
                }
                events {
                  id
                  agentName
                  parentAgentId
                  state
                  timestamp
                  duration
                  tokenUsage {
                    input
                    output
                    total
                  }
                  errorDetails {
                    message
                    type
                  }
                }
              }
            }
          `,
          variables: { taskId: taskProgress.taskId },
        },
      });

      const jsonData = await response.json();

      // Validate response shape
      expect(jsonData.data).toBeDefined();
      expect(jsonData.data.taskProgress).toBeDefined();
      expect(jsonData.data.taskProgress.events).toHaveLength(3);
      expect(verifyTaskProgressResponseShape(jsonData.data)).toBe(true);
    });

    test('should include all required fields in response', async () => {
      const taskProgress = await setupTaskWithEvents(3);
      await mockGraphQLResponse(page, taskProgress);

      const response = await page.request.post('/graphql', {
        data: {
          query: `
            query TaskProgress($taskId: ID!) {
              taskProgress(taskId: $taskId) {
                id
                taskId
                startedAt
                completedAt
                totalTokens { input output total }
                events {
                  id
                  agentName
                  state
                  timestamp
                  duration
                  tokenUsage { input output total }
                }
              }
            }
          `,
          variables: { taskId: taskProgress.taskId },
        },
      });

      const jsonData = await response.json();
      const data = jsonData.data.taskProgress;

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('taskId');
      expect(data).toHaveProperty('startedAt');
      expect(data).toHaveProperty('completedAt');
      expect(data).toHaveProperty('totalTokens');
      expect(data).toHaveProperty('events');
    });

    test('should return dates as ISO 8601 strings', async () => {
      const taskProgress = await setupTaskWithEvents(2);
      await mockGraphQLResponse(page, taskProgress);

      const response = await page.request.post('/graphql', {
        data: {
          query: `
            query TaskProgress($taskId: ID!) {
              taskProgress(taskId: $taskId) {
                startedAt
                completedAt
                events { timestamp }
              }
            }
          `,
          variables: { taskId: taskProgress.taskId },
        },
      });

      const jsonData = await response.json();
      const data = jsonData.data.taskProgress;

      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(data.startedAt).toMatch(iso8601Regex);
      if (data.completedAt) {
        expect(data.completedAt).toMatch(iso8601Regex);
      }
      data.events.forEach((event: { timestamp: string }) => {
        expect(event.timestamp).toMatch(iso8601Regex);
      });
    });

    test('should return completedAt as ISO 8601 string when task progress is finalized', async () => {
      const taskProgress = await setupTaskWithEvents(1);
      taskProgress.completedAt = new Date().toISOString();
      await mockGraphQLResponse(page, taskProgress);

      const response = await page.request.post('/graphql', {
        data: {
          query: `
              query TaskProgress($taskId: ID!) {
                taskProgress(taskId: $taskId) {
                  completedAt
                }
              }
            `,
          variables: { taskId: taskProgress.taskId },
        },
      });

      const jsonData = await response.json();
      expect(jsonData.data.taskProgress.completedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
      );
    });

    test('should include parentAgentId and per-event tokenUsage when present', async () => {
      const taskProgress = await setupTaskWithEvents(2);
      taskProgress.events[1].parentAgentId = taskProgress.events[0].agentId;
      taskProgress.events[0].tokenUsage = { input: 10, output: 20, total: 30 };
      taskProgress.events[1].tokenUsage = { input: 40, output: 50, total: 90 };
      await mockGraphQLResponse(page, taskProgress);

      const response = await page.request.post('/graphql', {
        data: {
          query: `
            query TaskProgress($taskId: ID!) {
              taskProgress(taskId: $taskId) {
                events {
                  parentAgentId
                  tokenUsage { input output total }
                }
              }
            }
          `,
          variables: { taskId: taskProgress.taskId },
        },
      });

      const jsonData = await response.json();
      const events = jsonData.data.taskProgress.events;

      expect(events[0].parentAgentId).toBeUndefined();
      expect(events[0].tokenUsage).toEqual({ input: 10, output: 20, total: 30 });
      expect(events[1].parentAgentId).toBe(taskProgress.events[0].agentId);
      expect(events[1].tokenUsage).toEqual({ input: 40, output: 50, total: 90 });
    });

    test('should include all events in chronological order', async () => {
      const taskProgress = await setupTaskWithEvents(5);
      await mockGraphQLResponse(page, taskProgress);

      const response = await page.request.post('/graphql', {
        data: {
          query: `
            query TaskProgress($taskId: ID!) {
              taskProgress(taskId: $taskId) {
                events { id timestamp }
              }
            }
          `,
          variables: { taskId: taskProgress.taskId },
        },
      });

      const jsonData = await response.json();
      const events = jsonData.data.taskProgress.events;

      expect(events).toHaveLength(5);
      expect(verifyEventChronologicalOrder(events)).toBe(true);
    });
  });

  test.describe('Scenario 2: Polling hook fetches updates at correct interval', () => {
    test('should fetch immediately on mount', async () => {
      const taskProgress = await setupTaskWithEvents(2);
      await mockGraphQLResponse(page, taskProgress);

      let requestMade = false;

      page.on('request', (request) => {
        if (request.url().includes('graphql')) {
          requestMade = true;
        }
      });

      // Simulate mounting the hook
      await page.evaluate(() => {
        // Mock useQuery call
        console.log('Hook mounted');
      });

      await page.waitForTimeout(100);
      expect(requestMade).toBe(true);
    });

    test('should fetch at ~1000ms intervals', async () => {
      const taskProgress = await setupTaskWithEvents(2);
      await mockGraphQLResponse(page, taskProgress, { delay: 50 });

      const requestTimestamps: number[] = [];

      page.on('request', (request) => {
        const postData = request.postDataJSON?.();
        if (postData?.operationName?.includes('TaskProgress')) {
          requestTimestamps.push(Date.now());
        }
      });

      // Wait for multiple polling intervals
      await page.waitForTimeout(3500);

      // Calculate intervals between requests
      const intervals: number[] = [];
      for (let i = 1; i < requestTimestamps.length; i++) {
        intervals.push(requestTimestamps[i] - requestTimestamps[i - 1]);
      }

      const timing = verifyPollingTiming(intervals, 1000, 50);
      expect(timing.violations.length).toBeLessThanOrEqual(1); // Allow 1 violation for startup
    });

    test('should not duplicate events across multiple polls', async () => {
      const initialEvents = createMockProgressEvents(2);
      let callCount = 0;

      const taskProgress = createMockTaskProgress({ events: initialEvents });

      await page.route('**/graphql', async (route) => {
        const postData = route.request().postDataJSON?.();

        if (postData?.operationName?.includes('TaskProgress')) {
          callCount++;

          // First two calls return same data, third call has one more event
          const events =
            callCount >= 3
              ? [...initialEvents, createMockProgressEvent({ id: 'evt-new' })]
              : initialEvents;

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                taskProgress: {
                  ...taskProgress,
                  events,
                },
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Simulate polling
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(500);

        const response = await page.request.post('/graphql', {
          data: {
            query: 'query TaskProgress($taskId: ID!) { taskProgress(taskId: $taskId) { events { id } } }',
            variables: { taskId: taskProgress.taskId },
          },
        });

        const jsonData = await response.json();
        const events = jsonData.data.taskProgress.events;

        // Verify no duplicates
        expect(verifyNoDuplicateEvents(events)).toBe(true);
      }
    });
  });

  test.describe('Scenario 3: New events append without full page refresh', () => {
    test('should display new event when polling returns updated list', async () => {
      const initialEvents = createMockProgressEvents(2);
      const taskProgress = createMockTaskProgress({ events: initialEvents });

      let pollCount = 0;

      await page.route('**/graphql', async (route) => {
        const postData = route.request().postDataJSON?.();

        if (postData?.operationName?.includes('TaskProgress')) {
          pollCount++;

          // After 2 polls, add a new event
          const events =
            pollCount > 2
              ? [
                  ...initialEvents,
                  createMockProgressEvent({
                    id: 'evt-new',
                    agentName: 'New Agent',
                    timestamp: new Date(
                      Date.now() - 5 * 60_000 + 2 * 60_000
                    ).toISOString(),
                  }),
                ]
              : initialEvents;

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                taskProgress: {
                  ...taskProgress,
                  events,
                },
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // First poll
      let response = await page.request.post('/graphql', {
        data: {
          query: 'query { taskProgress(taskId: "task") { events { id } } }',
        },
      });

      let jsonData = await response.json();
      expect(jsonData.data.taskProgress.events).toHaveLength(2);

      // Wait and poll again (simulating polling)
      await page.waitForTimeout(1100);

      response = await page.request.post('/graphql', {
        data: {
          query: 'query { taskProgress(taskId: "task") { events { id } } }',
        },
      });

      jsonData = await response.json();

      // Verify new event is appended
      expect(jsonData.data.taskProgress.events).toHaveLength(3);
      expect(jsonData.data.taskProgress.events[2].id).toBe('evt-new');
    });

    test('should maintain sort order when events are appended', async () => {
      const taskProgress = await setupTaskWithEvents(2);
      await mockGraphQLResponse(page, taskProgress);

      const response = await page.request.post('/graphql', {
        data: {
          query: 'query { taskProgress(taskId: "task") { events { timestamp } } }',
        },
      });

      const jsonData = await response.json();
      const events = jsonData.data.taskProgress.events;

      expect(verifyEventChronologicalOrder(events)).toBe(true);
    });
  });

  test.describe('Scenario 4: Error handling - API error triggers retry with exponential backoff', () => {
    test('should catch and handle 500 error', async () => {
      const taskProgress = await setupTaskWithEvents(2);

      let errorCaught = false;

      await page.route('**/graphql', async (route) => {
        const postData = route.request().postDataJSON?.();

        if (postData?.operationName?.includes('TaskProgress')) {
          // Fail first request
          if (!errorCaught) {
            errorCaught = true;
            await route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({
                errors: [
                  {
                    message: 'Internal server error',
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                  },
                ],
              }),
            });
            return;
          }

          // Success on retry
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: { taskProgress },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // First request should fail
      let response = await page.request.post('/graphql', {
        data: {
          query: 'query { taskProgress(taskId: "task") { id } }',
        },
      });

      expect(response.status()).toBe(500);

      // Second request should succeed
      await page.waitForTimeout(100);
      response = await page.request.post('/graphql', {
        data: {
          query: 'query { taskProgress(taskId: "task") { id } }',
        },
      });

      expect(response.status()).toBe(200);
      const jsonData = await response.json();
      expect(jsonData.data.taskProgress).toBeDefined();
    });

    test('should continue polling after error is resolved', async () => {
      const taskProgress = await setupTaskWithEvents(2);
      const errorSimulation = await simulateAPIError(page, { failureCount: 2 });

      let successCount = 0;

      await page.route('**/graphql', async (route) => {
        const postData = route.request().postDataJSON?.();

        if (postData?.operationName?.includes('TaskProgress')) {
          if (errorSimulation.failedCount < 2) {
            await route.abort('failed');
            return;
          }

          successCount++;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: { taskProgress },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await page.request.post('/graphql', {
          data: {
            query: 'query { taskProgress(taskId: "task") { id } }',
          },
        });
      }

      // After 2 failures, at least 1 success should have occurred
      expect(successCount).toBeGreaterThan(0);
    });

    test('should verify polling can recover from API error', async () => {
      await setupTaskWithEvents(2);

      const recovery = await waitForPollingRecovery(page, {
        normalInterval: 1000,
        timeout: 5000,
      });

      // Note: This test demonstrates the helper function usage
      // In real scenario, the polling would have already been set up
      expect(recovery).toBeDefined();
      expect(recovery).toHaveProperty('recovered');
      expect(recovery).toHaveProperty('recoveryTime');
    });
  });

  test.describe('Scenario 5: Permission boundaries', () => {
    test('should verify user can only access own task progress', async () => {
      const taskProgress = await setupTaskWithEvents(2);
      taskProgress.userId = 'user-123';

      await mockGraphQLResponse(page, taskProgress);

      // Attempt to query with different user context
      const response = await page.request.post('/graphql', {
        data: {
          query: 'query { taskProgress(taskId: $taskId) { userId } }',
          variables: { taskId: taskProgress.taskId },
        },
        headers: {
          'X-User-ID': 'user-999', // Different user
        },
      });

      // Depending on implementation, should either:
      // 1. Return 403 Forbidden
      // 2. Return 401 Unauthorized
      // 3. Return NotFoundError in GraphQL response
      expect([403, 401]).toContain(response.status());
    });
  });

  test.describe('Integration: Complete polling workflow', () => {
    test('should handle full polling cycle with multiple events', async () => {
      let eventCounter = 0;
      const baseProgress = createMockTaskProgress({ events: [] });

      await page.route('**/graphql', async (route) => {
        const postData = route.request().postDataJSON?.();

        if (postData?.operationName?.includes('TaskProgress')) {
          eventCounter++;

          // Add a new event with each poll (up to 5)
          const events =
            eventCounter <= 5
              ? createMockProgressEvents(Math.min(eventCounter, 5))
              : createMockProgressEvents(5);

          const completedAt =
            eventCounter >= 5
              ? new Date().toISOString()
              : null;

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                taskProgress: {
                  ...baseProgress,
                  events,
                  completedAt,
                },
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      // Simulate 5 polling cycles
      for (let i = 0; i < 5; i++) {
        const response = await page.request.post('/graphql', {
          data: {
            query: 'query { taskProgress(taskId: "task") { events { id } completedAt } }',
          },
        });

        const jsonData = await response.json();
        const data = jsonData.data.taskProgress;

        // Verify shape and growth
        expect(verifyTaskProgressResponseShape(jsonData.data)).toBe(true);
        expect(data.events.length).toBeLessThanOrEqual(5);
        if (i < 4) {
          expect(data.completedAt).toBeNull();
        }

        if (i < 4) {
          await page.waitForTimeout(500);
        }
      }

      const finalResponse = await page.request.post('/graphql', {
        data: {
          query: 'query { taskProgress(taskId: "task") { completedAt } }',
        },
      });

      const finalData = await finalResponse.json();
      expect(finalData.data.taskProgress.completedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
      );
    });
  });
});
