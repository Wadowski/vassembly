import { z } from 'zod';

import {
  AgentCategory,
  AgentStatus,
  SYSTEM_AGENT_DESCRIPTION_MAX_LENGTH,
  SYSTEM_AGENT_NAME_MAX_LENGTH,
  SYSTEM_AGENT_NAME_MIN_LENGTH,
  SYSTEM_AGENT_RULE_MAX_LENGTH,
  SYSTEM_AGENT_RULE_MIN_LENGTH,
} from '../../constants';

import { assignedToolIdsCreateSchema, assignedToolIdsUpdateSchema } from './assignedToolIdsSchema';

const CATEGORY_VALUES = Object.values(AgentCategory) as [AgentCategory, ...AgentCategory[]];

const STATUS_VALUES = Object.values(AgentStatus) as [AgentStatus, ...AgentStatus[]];

export const SYSTEM_AGENT_NAME_SCHEMA = z
  .string()
  .trim()
  .min(SYSTEM_AGENT_NAME_MIN_LENGTH)
  .max(SYSTEM_AGENT_NAME_MAX_LENGTH);

export const SYSTEM_AGENT_RULE_SCHEMA = z
  .string()
  .min(SYSTEM_AGENT_RULE_MIN_LENGTH)
  .max(SYSTEM_AGENT_RULE_MAX_LENGTH);

export const SYSTEM_AGENT_DESCRIPTION_SCHEMA = z
  .string()
  .max(SYSTEM_AGENT_DESCRIPTION_MAX_LENGTH);

export const SYSTEM_AGENT_CATEGORY_SCHEMA = z.enum(CATEGORY_VALUES);

export const SYSTEM_AGENT_STATUS_SCHEMA = z.enum(STATUS_VALUES);

export const CREATE_SYSTEM_AGENT_SCHEMA = z.object({
  name: SYSTEM_AGENT_NAME_SCHEMA,
  rule: SYSTEM_AGENT_RULE_SCHEMA,
  description: SYSTEM_AGENT_DESCRIPTION_SCHEMA.optional(),
  category: SYSTEM_AGENT_CATEGORY_SCHEMA.optional(),
  createdByAdminId: z.string().min(1),
  updatedByAdminId: z.string().min(1).optional(),
  assignedToolIds: assignedToolIdsCreateSchema,
  specializationId: z.string().min(1).max(100).nullable().optional(),
});

export const UPDATE_SYSTEM_AGENT_DATA_SCHEMA = z
  .object({
    name: SYSTEM_AGENT_NAME_SCHEMA.optional(),
    rule: SYSTEM_AGENT_RULE_SCHEMA.optional(),
    description: SYSTEM_AGENT_DESCRIPTION_SCHEMA.nullable().optional(),
    category: SYSTEM_AGENT_CATEGORY_SCHEMA.nullable().optional(),
    status: SYSTEM_AGENT_STATUS_SCHEMA.optional(),
    assignedToolIds: assignedToolIdsUpdateSchema,
  })
  .strict();

export const UPDATE_SYSTEM_AGENT_SCHEMA = z.object({
  id: z.string().min(1),
  updatedByAdminId: z.string().min(1),
  data: UPDATE_SYSTEM_AGENT_DATA_SCHEMA,
});

export const INVOKE_SYSTEM_AGENT_SCHEMA = z.object({
  systemAgentId: z.string().min(1),
  message: z.string().trim().min(1),
});

export const UPSERT_PREFERENCE_SCHEMA = z.object({
  userId: z.string().min(1),
  integrationCredentialId: z.string().min(1),
});
