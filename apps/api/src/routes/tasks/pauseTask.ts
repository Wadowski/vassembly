import { UnauthorizedError, WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { handlers as authHandlers } from '@vassembly/service-auth';
import taskService from '@vassembly/service-task';

import { taskResponseSchema } from './create';
import { withErrorResponses } from '../errorSchema';

export const taskPauseRoute = defineRoute({
  method: 'PATCH',
  url: '/:id/pause',
  schema: {
    response: withErrorResponses(taskResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const taskId = params?.id;

    if (!taskId || taskId === '') {
      throw new WrongParamError('Missing task id');
    }

    const authResult = await authHandlers.authorizeRequest({ headers });
    const userId = authResult.userId;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    const { task } = await taskService.pauseTask({ userId, taskId });
    return task;
  },
});
