import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers } from '@vassembly/service-auth';
import { withErrorResponses } from '../errorSchema';

const verifyEmailBodySchema = z.object({
  token: z.string().min(1),
});

export const verifyEmailResponseSchema = z.object({
  success: z.boolean(),
});

export const verifyEmailRoute = defineRoute({
  method: 'POST',
  url: '/verify-email',
  statusCode: 200,
  schema: {
    body: verifyEmailBodySchema,
    response: withErrorResponses(verifyEmailResponseSchema, 200),
  },
  handler: async ({ body, headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.confirmEmailVerification({ userId, token: body.token });
  },
});
