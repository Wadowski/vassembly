import { z } from 'zod';

export const invokeSkillPlannerSchema = z.object({
  specializationId: z.string().min(1),
  goal: z.string().min(1).describe('What the new skill must enable for this task'),
});
