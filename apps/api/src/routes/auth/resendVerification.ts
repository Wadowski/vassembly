import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers } from '@vassembly/service-auth';
import { withErrorResponses } from '../errorSchema';

export const resendVerificationResponseSchema = z.object({
  success: z.boolean(),
});

export const resendVerificationRoute = defineRoute({
  method: 'POST',
  url: '/resend-verification',
  statusCode: 200,
  schema: {
    response: withErrorResponses(resendVerificationResponseSchema, 200),
  },
  handler: async ({ headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.resendEmailVerification({ userId });
  },
});
