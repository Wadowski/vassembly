import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Builder } from '@vassembly/graphql';
import {
  NotFoundError,
  UnauthorizedError,
} from '@vassembly/errors';

const { mockGetTaskProgressByTaskId, mockResolveAgentDisplayNames } = vi.hoisted(() => ({
  mockGetTaskProgressByTaskId: vi.fn(),
  mockResolveAgentDisplayNames: vi.fn(),
}));

vi.mock('@vassembly/domain-task-progress', () => ({
  queries: {
    getTaskProgressByTaskId: mockGetTaskProgressByTaskId,
  },
}));

vi.mock('./shared/resolveAgentDisplayName', () => ({
  resolveAgentDisplayNames: mockResolveAgentDisplayNames,
}));

import { registerTaskProgressResolvers } from './taskProgress';

interface TaskProgressResolverArgs {
  taskId: string;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
}

type TaskProgressResolver = (
  root: unknown,
  args: TaskProgressResolverArgs,
  context: ApiGraphQLContext
) => Promise<{
  id: string;
  taskId: string;
  startedAt: string;
  completedAt?: string;
  totalTokens?: { input: number; output: number; total: number };
  events: Array<{
    id: string;
    agentId: string;
    agentName?: string;
    state: string;
    timestamp: string;
    duration?: number;
    tokenUsage?: { input: number; output: number; total: number };
    errorDetails?: {
      message: string;
      type?: string;
      stackTrace?: string;
    };
  }>;
}>;

interface CapturedTaskProgressResolvers {
  resolveTaskProgress?: TaskProgressResolver;
}

const captureTaskProgressResolver = (): CapturedTaskProgressResolvers => {
  const captured: CapturedTaskProgressResolvers = {};

  const arg = {
    id: (config: unknown) => config,
    string: (config: unknown) => config,
  };

  const builder = {
    queryFields: (
      fieldsFactory: (t: {
        field: (config: {
          resolve: TaskProgressResolver;
          args?: Record<string, unknown>;
          type?: string;
        }) => void;
        arg: typeof arg;
      }) => void
    ) => {
      fieldsFactory({
        field: (config) => {
          captured.resolveTaskProgress = config.resolve as TaskProgressResolver;
        },
        arg,
      });
    },
  } as unknown as Builder;

  registerTaskProgressResolvers(builder);

  return captured;
};

const captureTaskProgressResolverFn = (): TaskProgressResolver => {
  const { resolveTaskProgress } = captureTaskProgressResolver();

  if (resolveTaskProgress === undefined) {
    throw new Error('Failed to capture taskProgress resolver');
  }

  return resolveTaskProgress;
};

describe('TaskProgress Resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolveAgentDisplayNames.mockImplementation(async ({ agentIds }) => {
      const nameMap = new Map<string, string>();
      for (const agentId of agentIds) {
        if (agentId === 'agent-1') {
          nameMap.set(agentId, 'Agent 1');
        }
        if (agentId === 'agent-2') {
          nameMap.set(agentId, 'Agent 2');
        }
      }
      return nameMap;
    });
  });

  describe('taskProgress query', () => {
    it('should return correct TaskProgress shape when task exists', async () => {
      const resolver = captureTaskProgressResolverFn();
      const mockData = {
        data: {
          id: 'prog-123',
          taskId: 'task-123',
          startedAt: '2026-06-15T10:00:00Z',
          completedAt: undefined,
          totalTokens: {
            input: 150,
            output: 280,
            total: 430,
          },
          events: [
            {
              id: 'evt-1',
              agentId: 'agent-1',
              state: 'COMPLETED',
              timestamp: '2026-06-15T10:00:10Z',
              duration: 1000,
              tokenUsage: {
                input: 100,
                output: 200,
                total: 300,
              },
            },
          ],
        },
      };

      mockGetTaskProgressByTaskId.mockResolvedValue(mockData);

      const result = await resolver(
        undefined,
        { taskId: 'task-123' },
        { authenticatedUserId: 'user-456' }
      );

      expect(result).toEqual({
        ...mockData.data,
        events: [
          {
            ...mockData.data.events[0]!,
            agentName: 'Agent 1',
          },
        ],
      });
      expect(result.id).toBe('prog-123');
      expect(result.taskId).toBe('task-123');
      expect(result.events).toHaveLength(1);
      expect(result.events[0]!.timestamp).toBe('2026-06-15T10:00:10Z');
    });

    it('should validate dates are ISO 8601 strings', async () => {
      const resolver = captureTaskProgressResolverFn();
      const mockData = {
        data: {
          id: 'prog-123',
          taskId: 'task-123',
          startedAt: '2026-06-15T10:00:00.000Z',
          completedAt: '2026-06-15T10:05:00.000Z',
          totalTokens: {
            input: 150,
            output: 280,
            total: 430,
          },
          events: [
            {
              id: 'evt-1',
              agentId: 'agent-1',
              state: 'COMPLETED',
              timestamp: '2026-06-15T10:00:10.000Z',
              duration: 1000,
            },
          ],
        },
      };

      mockGetTaskProgressByTaskId.mockResolvedValue(mockData);

      const result = await resolver(
        undefined,
        { taskId: 'task-123' },
        { authenticatedUserId: 'user-456' }
      );

      // Validate ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(result.startedAt).toMatch(iso8601Regex);
      expect(result.completedAt).toBeDefined();
      expect(result.completedAt!).toMatch(iso8601Regex);
      expect(result.events[0]!.timestamp).toMatch(iso8601Regex);
    });

    it('should handle events array with all required fields', async () => {
      const resolver = captureTaskProgressResolverFn();
      const mockData = {
        data: {
          id: 'prog-123',
          taskId: 'task-123',
          startedAt: '2026-06-15T10:00:00Z',
          totalTokens: {
            input: 150,
            output: 280,
            total: 430,
          },
          events: [
            {
              id: 'evt-1',
              agentId: 'agent-1',
              state: 'STARTED',
              timestamp: '2026-06-15T10:00:00Z',
              duration: 500,
              tokenUsage: {
                input: 50,
                output: 100,
                total: 150,
              },
            },
            {
              id: 'evt-2',
              agentId: 'agent-2',
              state: 'COMPLETED',
              timestamp: '2026-06-15T10:00:30Z',
              duration: 1200,
              tokenUsage: {
                input: 100,
                output: 180,
                total: 280,
              },
            },
          ],
        },
      };

      mockGetTaskProgressByTaskId.mockResolvedValue(mockData);

      const result = await resolver(
        undefined,
        { taskId: 'task-123' },
        { authenticatedUserId: 'user-456' }
      );

      expect(result.events).toHaveLength(2);
      expect(result.events[0]!).toHaveProperty('id');
      expect(result.events[0]!).toHaveProperty('agentName');
      expect(result.events[0]!).toHaveProperty('state');
      expect(result.events[0]!).toHaveProperty('timestamp');
      expect(result.events[0]!).toHaveProperty('tokenUsage');
    });

    it('should throw UnauthorizedError when userId is missing', async () => {
      const resolver = captureTaskProgressResolverFn();

      await expect(
        resolver(undefined, { taskId: 'task-123' }, { authenticatedUserId: undefined })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw NotFoundError when task progress does not exist', async () => {
      const resolver = captureTaskProgressResolverFn();

      mockGetTaskProgressByTaskId.mockResolvedValue({ data: null });

      await expect(
        resolver(
          undefined,
          { taskId: 'task-123' },
          { authenticatedUserId: 'user-456' }
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should pass correct arguments to domain query', async () => {
      const resolver = captureTaskProgressResolverFn();
      const mockData = {
        data: {
          id: 'prog-123',
          taskId: 'task-123',
          startedAt: '2026-06-15T10:00:00Z',
          totalTokens: {
            input: 150,
            output: 280,
            total: 430,
          },
          events: [],
        },
      };

      mockGetTaskProgressByTaskId.mockResolvedValue(mockData);

      await resolver(
        undefined,
        { taskId: 'task-123' },
        { authenticatedUserId: 'user-456' }
      );

      expect(mockGetTaskProgressByTaskId).toHaveBeenCalledWith({
        taskId: 'task-123',
        userId: 'user-456',
      });
    });

    it('should handle optional completedAt field', async () => {
      const resolver = captureTaskProgressResolverFn();
      const mockData = {
        data: {
          id: 'prog-123',
          taskId: 'task-123',
          startedAt: '2026-06-15T10:00:00Z',
          completedAt: undefined,
          totalTokens: {
            input: 150,
            output: 280,
            total: 430,
          },
          events: [],
        },
      };

      mockGetTaskProgressByTaskId.mockResolvedValue(mockData);

      const result = await resolver(
        undefined,
        { taskId: 'task-123' },
        { authenticatedUserId: 'user-456' }
      );

      expect(result.completedAt).toBeUndefined();
    });

    it('should handle events with optional duration field', async () => {
      const resolver = captureTaskProgressResolverFn();
      const mockData = {
        data: {
          id: 'prog-123',
          taskId: 'task-123',
          startedAt: '2026-06-15T10:00:00Z',
          totalTokens: {
            input: 150,
            output: 280,
            total: 430,
          },
          events: [
            {
              id: 'evt-1',
              agentId: 'agent-1',
              state: 'STARTED',
              timestamp: '2026-06-15T10:00:00Z',
              duration: undefined,
            },
          ],
        },
      };

      mockGetTaskProgressByTaskId.mockResolvedValue(mockData);

      const result = await resolver(
        undefined,
        { taskId: 'task-123' },
        { authenticatedUserId: 'user-456' }
      );

      expect(result.events[0]!.duration).toBeUndefined();
    });

    it('should handle error details in events', async () => {
      const resolver = captureTaskProgressResolverFn();
      const mockData = {
        data: {
          id: 'prog-123',
          taskId: 'task-123',
          startedAt: '2026-06-15T10:00:00Z',
          completedAt: '2026-06-15T10:00:30Z',
          totalTokens: {
            input: 150,
            output: 280,
            total: 430,
          },
          events: [
            {
              id: 'evt-1',
              agentId: 'agent-1',
              state: 'FAILED',
              timestamp: '2026-06-15T10:00:30Z',
              duration: 1000,
              errorDetails: {
                message: 'LLM API timeout',
                type: 'TimeoutError',
                stackTrace: 'at Agent.execute (agent.ts:123)',
              },
            },
          ],
        },
      };

      mockGetTaskProgressByTaskId.mockResolvedValue(mockData);

      const result = await resolver(
        undefined,
        { taskId: 'task-123' },
        { authenticatedUserId: 'user-456' }
      );

      expect(result.events[0]!.errorDetails).toBeDefined();
      expect(result.events[0]!.errorDetails?.message).toBe('LLM API timeout');
    });
  });
});
