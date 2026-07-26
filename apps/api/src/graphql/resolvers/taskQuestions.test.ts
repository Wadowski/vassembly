import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Builder } from '@vassembly/graphql';
import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

const { mockGetModelById, mockGetTaskQuestions, mockToTaskQuestionsResponse } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockGetTaskQuestions: vi.fn(),
  mockToTaskQuestionsResponse: vi.fn(),
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    queries: {
      getModelById: mockGetModelById,
    },
  },
}));

vi.mock('@vassembly/domain-task-questions', () => ({
  default: {
    queries: {
      getTaskQuestions: mockGetTaskQuestions,
    },
  },
  toTaskQuestionsResponse: mockToTaskQuestionsResponse,
}));

import { registerTaskQuestionsResolvers } from './taskQuestions';

interface TaskQuestionsResolverArgs {
  taskId: string;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
  onboardingCompleted?: boolean;
}

type TaskQuestionsResolver = (
  root: unknown,
  args: TaskQuestionsResolverArgs,
  context: ApiGraphQLContext,
) => Promise<{
  taskId: string;
  pendingQuestions: unknown[];
  answeredQuestions: unknown[];
}>;

interface CapturedTaskQuestionsResolvers {
  resolveTaskQuestions?: TaskQuestionsResolver;
}

const captureTaskQuestionsResolver = (): CapturedTaskQuestionsResolvers => {
  const captured: CapturedTaskQuestionsResolvers = {};

  const arg = {
    id: (config: unknown) => config,
    string: (config: unknown) => config,
  };

  const builder = {
    queryFields: (
      fieldsFactory: (t: {
        field: (config: {
          resolve: TaskQuestionsResolver;
          args?: Record<string, unknown>;
          type?: string;
        }) => void;
        arg: typeof arg;
      }) => void,
    ) => {
      fieldsFactory({
        field: (config) => {
          captured.resolveTaskQuestions = config.resolve as TaskQuestionsResolver;
        },
        arg,
      });
    },
  } as unknown as Builder;

  registerTaskQuestionsResolvers(builder);

  return captured;
};

const captureTaskQuestionsResolverFn = (): TaskQuestionsResolver => {
  const { resolveTaskQuestions } = captureTaskQuestionsResolver();

  if (resolveTaskQuestions === undefined) {
    throw new Error('Failed to capture taskQuestions resolver');
  }

  return resolveTaskQuestions;
};

describe('TaskQuestions Resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelById.mockResolvedValue({
      data: { id: 'task-1', userId: 'user-1' },
    });
    mockGetTaskQuestions.mockResolvedValue({
      data: {
        taskId: 'task-1',
        pendingQuestions: [],
        answeredQuestions: [],
      },
    });
    mockToTaskQuestionsResponse.mockImplementation(({ taskQuestions }) => ({
      taskId: taskQuestions.taskId,
      pendingQuestions: taskQuestions.pendingQuestions ?? [],
      answeredQuestions: taskQuestions.answeredQuestions ?? [],
    }));
  });

  describe('taskQuestions query', () => {
    it('should return task questions when task exists and caller owns it', async () => {
      const resolver = captureTaskQuestionsResolverFn();

      const result = await resolver(
        undefined,
        { taskId: 'task-1' },
        { authenticatedUserId: 'user-1', onboardingCompleted: true },
      );

      expect(result).toEqual({
        taskId: 'task-1',
        pendingQuestions: [],
        answeredQuestions: [],
      });
    });

    it('should return empty questions when no document exists', async () => {
      const resolver = captureTaskQuestionsResolverFn();
      mockGetTaskQuestions.mockResolvedValue({ data: null });

      const result = await resolver(
        undefined,
        { taskId: 'task-1' },
        { authenticatedUserId: 'user-1', onboardingCompleted: true },
      );

      expect(result).toEqual({
        taskId: 'task-1',
        pendingQuestions: [],
        answeredQuestions: [],
      });
    });

    it('should throw UnauthorizedError when userId is missing', async () => {
      const resolver = captureTaskQuestionsResolverFn();

      await expect(
        resolver(undefined, { taskId: 'task-1' }, { authenticatedUserId: undefined, onboardingCompleted: true }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw NotFoundError when task does not belong to user', async () => {
      const resolver = captureTaskQuestionsResolverFn();
      mockGetModelById.mockResolvedValue({
        data: { id: 'task-1', userId: 'other-user' },
      });

      await expect(
        resolver(undefined, { taskId: 'task-1' }, { authenticatedUserId: 'user-1', onboardingCompleted: true }),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
