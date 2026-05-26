import { AgentCategory, AgentStatus } from '@vassembly/domain-system-agent';
import { z } from 'zod';

const AGENT_CATEGORY_VALUES = Object.values(AgentCategory) as [AgentCategory, ...AgentCategory[]];

const AGENT_STATUS_VALUES = Object.values(AgentStatus) as [AgentStatus, ...AgentStatus[]];

export const CREATE_SYSTEM_AGENT_BODY_SCHEMA = z.object({
  name: z.string().min(1).max(100).trim(),
  rule: z.string().min(1).max(5000),
  description: z.string().max(500).optional(),
  category: z.enum(AGENT_CATEGORY_VALUES).optional(),
});

export const UPDATE_SYSTEM_AGENT_BODY_SCHEMA = CREATE_SYSTEM_AGENT_BODY_SCHEMA.partial();

export const INVOKE_SYSTEM_AGENT_BODY_SCHEMA = z.object({
  message: z.string().min(1),
  connectionOverride: z
    .object({
      integrationCredentialId: z.string(),
    })
    .optional(),
});

export const SET_CONNECTION_PREFERENCE_BODY_SCHEMA = z.object({
  integrationCredentialId: z.string(),
});

export const SYSTEM_AGENT_LIST_QUERY_SCHEMA = z.object({
  status: z.enum(AGENT_STATUS_VALUES).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
});
