import { z } from 'zod';

export const useAgentSchema = z.object({
  name: z.string().min(1),
  agentPrompt: z.string().min(1),
});
