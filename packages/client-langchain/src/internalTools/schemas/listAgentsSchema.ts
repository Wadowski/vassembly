import { z } from 'zod';

export const listAgentsSchema = z.object({
  specializationIds: z.array(z.string().min(1)).max(3).optional(),
  role: z.enum(['researcher', 'worker', 'validator']).optional(),
});
