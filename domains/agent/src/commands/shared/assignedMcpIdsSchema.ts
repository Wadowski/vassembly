import { z } from 'zod';

import { AGENT_MAX_ASSIGNED_MCPS } from '../../constants';

const ASSIGNED_MCP_IDS_BASE = z
  .array(z.string().min(1))
  .max(AGENT_MAX_ASSIGNED_MCPS)
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'assignedMcpIds must not contain duplicates',
  });

export const assignedMcpIdsCreateSchema = ASSIGNED_MCP_IDS_BASE.optional().default([]);

export const assignedMcpIdsUpdateSchema = ASSIGNED_MCP_IDS_BASE.optional();
