import { UnauthorizedError, WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import taskService from '@vassembly/service-task';

import { taskResponseSchema } from './create';
import { withErrorResponses } from '../errorSchema';

export const taskRetryRoute = defineRoute({
  method: 'PATCH',
  url: '/:id/retry',
  schema: {
    response: withErrorResponses(taskResponseSchema),
  },
  handler: async ({ headers, params }) => {
    const taskId = params?.id;

    if (!taskId || taskId === '') {
      throw new WrongParamError('Missing task id');
    }

    const authResult = await authorizeProtectedRequest({ headers });
    const userId = authResult.userId;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    const { task } = await taskService.retryTask({ userId, taskId });
    return task;
  },
});
