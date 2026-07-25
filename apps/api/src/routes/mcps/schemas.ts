import { z } from 'zod';

export const mcpConfigurationFieldValuesSchema = z.record(
  z.string(),
  z.union([z.string(), z.boolean()]),
);

export const mcpConfigurationResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  mcpId: z.string(),
  status: z.string(),
  enabled: z.boolean(),
  fieldValues: z.array(
    z.object({
      key: z.string(),
      value: z.union([z.string(), z.boolean()]).optional(),
      hasSecret: z.boolean().optional(),
    }),
  ),
  lastTestedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const deleteMcpConfigurationResponseSchema = z.object({
  success: z.boolean(),
});

export const testMcpConfigurationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});
