import { UnauthorizedError, WrongParamError } from '@vassembly/errors';
import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { authorizeProtectedRequest } from '../shared/authorizeProtectedRequest';
import taskService from '@vassembly/service-task';

import { taskResponseSchema } from './create';
import { withErrorResponses } from '../errorSchema';

export const submitTaskCommentBodySchema = z.object({
  userText: z.string().min(1),
});

export const taskCommentResponseSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  userId: z.string(),
  userText: z.string(),
  agentResponse: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const submitTaskCommentResponseSchema = z.object({
  comment: taskCommentResponseSchema,
  task: taskResponseSchema,
});

export const taskSubmitCommentRoute = defineRoute({
  method: 'POST',
  url: '/:taskId/comments',
  statusCode: 201,
  schema: {
    body: submitTaskCommentBodySchema,
    response: withErrorResponses(submitTaskCommentResponseSchema, 201),
  },
  handler: async ({ body, headers, params }) => {
    const taskId = params?.taskId;

    if (!taskId || taskId === '') {
      throw new WrongParamError('Missing task id');
    }

    const authResult = await authorizeProtectedRequest({ headers });
    const userId = authResult.userId;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    return taskService.submitTaskComment({
      userId,
      taskId,
      userText: body.userText,
    });
  },
});
