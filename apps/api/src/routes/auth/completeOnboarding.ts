import { defineRoute } from '@vassembly/server';
import { z } from 'zod';

import { handlers } from '@vassembly/service-auth';
import { withErrorResponses } from '../errorSchema';

export const completeOnboardingResponseSchema = z.object({
  success: z.boolean(),
});

export const completeOnboardingRoute = defineRoute({
  method: 'POST',
  url: '/onboarding/complete',
  statusCode: 200,
  schema: {
    response: withErrorResponses(completeOnboardingResponseSchema, 200),
  },
  handler: async ({ headers }) => {
    const { userId } = await handlers.authorizeRequest({ headers });
    return handlers.finishOnboarding({ userId });
  },
});
