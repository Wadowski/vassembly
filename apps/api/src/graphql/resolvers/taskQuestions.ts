import { applyResolvers } from '@vassembly/graphql';
import taskDomain from '@vassembly/domain-task';
import taskQuestionsDomain, { toTaskQuestionsResponse } from '@vassembly/domain-task-questions';
import { NotFoundError, UnauthorizedError } from '@vassembly/errors';
import type { Builder } from '@vassembly/graphql';

import { enforceOnboardingCompleteForQuery } from '../shared/enforceOnboardingCompleteForQuery';
import type { ApiGraphQLContext } from '../shared/types';

interface TaskQuestionsResolverArgs {
  taskId: string;
}

const EMPTY_TASK_QUESTIONS = ({ taskId }: { taskId: string }) => ({
  taskId,
  pendingQuestions: [],
  answeredQuestions: [],
});

export const registerTaskQuestionsResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      taskQuestions: t.field({
        type: 'TaskQuestions',
        args: {
          taskId: t.arg.id({ required: true }),
        },
        resolve: async (
          _root: unknown,
          args: TaskQuestionsResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          enforceOnboardingCompleteForQuery({ queryName: 'taskQuestions', context });
          const userId = context.authenticatedUserId;

          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const taskResult = await taskDomain.queries.getModelById({ id: args.taskId });
          const task = taskResult.data;

          if (!task || task.userId !== userId) {
            throw new NotFoundError('Task not found');
          }

          const questionsResult = await taskQuestionsDomain.queries.getTaskQuestions({
            taskId: args.taskId,
          });
          const taskQuestions = questionsResult.data;

          if (!taskQuestions) {
            return EMPTY_TASK_QUESTIONS({ taskId: args.taskId });
          }

          return toTaskQuestionsResponse({ taskQuestions });
        },
      }),
    }),
  });
};
