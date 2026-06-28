import { UnauthorizedError, WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import taskQuestionsService from '@vassembly/service-task-questions';

import { withErrorResponses } from '../errorSchema';
import { submitAnswerBodySchema, taskQuestionsResponseSchema } from './taskQuestionsSchemas';

export const taskSubmitAnswerRoute = defineRoute({
  method: 'PATCH',
  url: '/:id/questions/:questionId/answer',
  schema: {
    body: submitAnswerBodySchema,
    response: withErrorResponses(taskQuestionsResponseSchema),
  },
  handler: async ({ body, headers, params }) => {
    const taskId = params?.id;
    const questionId = params?.questionId;

    if (!taskId || taskId === '') {
      throw new WrongParamError('Missing task id');
    }

    if (!questionId || questionId === '') {
      throw new WrongParamError('Missing question id');
    }

    const authResult = await authorizeProtectedRequest({ headers });
    const userId = authResult.userId;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    const { taskQuestions } = await taskQuestionsService.submitAnswer({
      userId,
      taskId,
      questionId,
      answer: body.answer,
    });

    return taskQuestions;
  },
});
