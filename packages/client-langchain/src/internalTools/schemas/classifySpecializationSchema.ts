import { z } from 'zod';

export const classifySpecializationSchema = z.object({
  taskId: z.string().min(1).optional(),
  description: z.string().min(1),
});
