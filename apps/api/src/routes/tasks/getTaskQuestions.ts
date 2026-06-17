import { UnauthorizedError, WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { handlers as authHandlers } from '@vassembly/service-auth';
import taskQuestionsService from '@vassembly/service-task-questions';

import { withErrorResponses } from '../errorSchema';
import { taskQuestionsResponseSchema } from './taskQuestionsSchemas';

export const taskGetQuestionsRoute = defineRoute({
  method: 'GET',
  url: '/:id/questions',
  schema: {
    response: withErrorResponses(taskQuestionsResponseSchema),
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

    const { taskQuestions } = await taskQuestionsService.getTaskQuestions({ userId, taskId });
    return taskQuestions;
  },
});
