import { UnauthorizedError } from '@vassembly/errors';
import { assertUserRateLimit, defineRoute } from '@vassembly/server';
import { handlers as authHandlers } from '@vassembly/service-auth';
import taskService from '@vassembly/service-task';
import { z } from 'zod';

export const taskCreateBodySchema = z.object({
  description: z.string().min(1).max(5000),
});

export const taskCreateRoute = defineRoute({
  method: 'POST',
  url: '/',
  statusCode: 201,
  schema: { body: taskCreateBodySchema },
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
