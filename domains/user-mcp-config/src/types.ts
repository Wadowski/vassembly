import { z } from 'zod';

import { USER_MCP_CONFIG_STATUS } from './constants';

export interface CreateUserMcpConfigInput {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
}

export interface UpdateUserMcpConfigInput {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
}

export interface UserMcpConfigFieldValueResponse {
  key: string;
  value?: string | boolean;
  hasSecret?: boolean;
}

export interface UserMcpConfigResponse {
  id: string;
  userId: string;
  mcpId: string;
  fieldValues: UserMcpConfigFieldValueResponse[];
  status: typeof USER_MCP_CONFIG_STATUS.Configured;
  enabled: boolean;
  lastTestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
}

const fieldValuesSchema = z.record(z.string(), z.union([z.string(), z.boolean()]));

export const createUserMcpConfigInputSchema = z.object({
  mcpId: z.string().min(1),
  fieldValues: fieldValuesSchema,
});

export const updateUserMcpConfigInputSchema = z.object({
  mcpId: z.string().min(1),
  fieldValues: fieldValuesSchema,
});

export const setUserMcpEnabledInputSchema = z.object({
  enabled: z.boolean(),
});
