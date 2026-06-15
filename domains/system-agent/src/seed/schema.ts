import { z } from 'zod';

import {
  AgentCategory,
  SYSTEM_AGENT_DESCRIPTION_MAX_LENGTH,
  SYSTEM_AGENT_NAME_MAX_LENGTH,
  SYSTEM_AGENT_NAME_MIN_LENGTH,
  SYSTEM_AGENT_RULE_MAX_LENGTH,
  SYSTEM_AGENT_RULE_MIN_LENGTH,
} from '../constants';
import { assignedToolIdsCreateSchema } from '../commands/shared/assignedToolIdsSchema';

const CATEGORY_VALUES = Object.values(AgentCategory) as [AgentCategory, ...AgentCategory[]];

export const systemAgentSeedSchema = z.object({
  name: z.string().trim().min(SYSTEM_AGENT_NAME_MIN_LENGTH).max(SYSTEM_AGENT_NAME_MAX_LENGTH),
  rule: z.string().min(SYSTEM_AGENT_RULE_MIN_LENGTH).max(SYSTEM_AGENT_RULE_MAX_LENGTH),
  description: z.string().max(SYSTEM_AGENT_DESCRIPTION_MAX_LENGTH).optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  assignedToolIds: assignedToolIdsCreateSchema,
});
