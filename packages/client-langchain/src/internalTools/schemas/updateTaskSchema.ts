import { z } from 'zod';

export const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1).optional(),
  category: z.string().optional(),
  specializationIds: z.array(z.string().min(1)).max(3).optional(),
  skillIdsUsed: z.array(z.string().min(1)).optional(),
});
