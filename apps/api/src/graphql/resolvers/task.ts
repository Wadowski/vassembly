import { applyResolvers } from '@vassembly/graphql';
import { toTaskResponse } from '@vassembly/domain-task';
import type { TaskModel } from '@vassembly/domain-task';
import { UnauthorizedError } from '@vassembly/errors';
import taskService from '@vassembly/service-task';
import type { Builder } from '@vassembly/graphql';

interface UserTasksResolverArgs {
  page?: number | null;
  size?: number | null;
  search?: string | null;
}

interface TaskResolverArgs {
  id: string;
}

interface ApiGraphQLContext {
  authenticatedUserId?: string;
}

export const registerTaskResolvers = (builder: Builder): void => {
  applyResolvers({
    builder,
    queries: (t) => ({
      userTasks: t.field({
        type: 'TasksList',
        args: {
          page: t.arg.int({ required: false, defaultValue: 0 }),
          size: t.arg.int({ required: false, defaultValue: 10 }),
          search: t.arg.string({ required: false }),
        },
        resolve: async (
          _root: unknown,
          args: UserTasksResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;

          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          const result = await taskService.listUserTasks({
            userId,
            page: args.page ?? 0,
            size: args.size ?? 10,
            search: args.search ?? undefined,
          });

          return {
            items: result.items.map((task) => toTaskResponse({ task: task as TaskModel })),
            totalCount: result.totalCount,
            page: result.page,
            size: result.size,
          };
        },
      }),
      task: t.field({
        type: 'Task',
        args: { id: t.arg.id({ required: true }) },
        resolve: async (
          _root: unknown,
          args: TaskResolverArgs,
          context: ApiGraphQLContext,
        ) => {
          const userId = context.authenticatedUserId;

          if (userId === undefined) {
            throw new UnauthorizedError('Authentication required');
          }

          return taskService.getTask({ userId, taskId: args.id });
        },
      }),
    }),
  });
};
