import { UnauthorizedError } from '@vassembly/errors';
import { assertUserRateLimit, defineRoute } from '@vassembly/server';
import { handlers as authHandlers } from '@vassembly/service-auth';
import taskService from '@vassembly/service-task';
import { z } from 'zod';
import { withErrorResponses } from '../errorSchema';

export const taskCreateBodySchema = z.object({
  description: z.string().min(1).max(5000),
});

export const taskResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  description: z.string(),
  type: z.string(),
  status: z.string(),
  agentAssignedId: z.string().nullable(),
  title: z.string().nullable(),
  llmResponse: z.string().nullable(),
  errorMessage: z.string().nullable(),
  errorCode: z.string().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  failedAt: z.string().datetime().nullable(),
  pausedAt: z.string().datetime().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const taskCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: {
    body: taskCreateBodySchema,
    response: withErrorResponses(taskResponseSchema, 201),
  },
  handler: async ({ body, headers }) => {
    const authResult = await authHandlers.authorizeRequest({ headers });
    const userId = authResult.userId;

    if (!userId) {
      throw new UnauthorizedError('Unauthorized');
    }

    assertUserRateLimit({ userId, limit: 5, windowMs: 60_000 });

    const { task } = await taskService.createTask({ userId, body });
    return task;
  },
});
