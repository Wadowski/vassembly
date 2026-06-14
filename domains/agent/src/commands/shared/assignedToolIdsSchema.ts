import { INTERNAL_TOOL_IDS } from '@vassembly/constants';
import { z } from 'zod';

const ASSIGNED_TOOL_IDS_BASE = z
  .array(z.string().min(1))
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'assignedToolIds must not contain duplicates',
  })
  .refine((ids) => ids.every((id) => INTERNAL_TOOL_IDS.includes(id)), {
    message: 'assignedToolIds contains unknown registry ids',
  });

export const assignedToolIdsCreateSchema = ASSIGNED_TOOL_IDS_BASE.optional().default([]);

export const assignedToolIdsUpdateSchema = ASSIGNED_TOOL_IDS_BASE.optional();
