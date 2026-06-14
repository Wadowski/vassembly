import { userMcpConfigDomain } from '@vassembly/domain-user-mcp-config';
import { McpConfigFieldType } from '@vassembly/domain-user-mcp-config';
import mcpDomain from '@vassembly/domain-mcp';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  WrongParamError,
} from '@vassembly/errors';

import type { TestConnectionResult, TestMcpConnectionInput } from './types';
import type { ServiceContext } from '../../types';
import type { McpConfigSchema, UserMcpConfigModel } from '@vassembly/domain-user-mcp-config';

export type { TestConnectionResult, TestMcpConnectionInput };

const mergeWithSavedSecrets = ({
  fieldValues,
  existing,
  schema,
}: {
  fieldValues: Record<string, string | boolean>;
  existing: UserMcpConfigModel;
  schema: McpConfigSchema;
}): Record<string, string | boolean> => {
  const merged = { ...fieldValues };
  const savedValues = existing.fieldValues ?? {};

  for (const field of schema.fields) {
    if (field.type !== McpConfigFieldType.Password) {
      continue;
    }

    const incomingValue = merged[field.key];

    if (incomingValue === '' || incomingValue === undefined) {
      const savedValue = savedValues[field.key];

      if (savedValue !== undefined) {
        merged[field.key] = savedValue;
      }
    }
  }

  return merged;
};

export const testMcpConnection = async (
  input: TestMcpConnectionInput,
  context: ServiceContext,
): Promise<TestConnectionResult> => {
  if (!context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  const mcpResult = await mcpDomain.queries.getById({ id: input.mcpId });
  const mcp = mcpResult.data;

  if (!mcp.configSchema) {
    throw new NotFoundError('MCP not found');
  }

  const existingConfig = await userMcpConfigDomain.queries.getConfigByMcpId({
    mcpId: input.mcpId,
  });

  if (existingConfig && existingConfig.userId !== context.userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  try {
    let fieldValues = input.fieldValues;

    if (input.useSavedSecrets) {
      const existing = await userMcpConfigDomain.queries.getUserMcpConfigModel({
        userId: context.userId,
        mcpId: input.mcpId,
      });

      if (existing) {
        fieldValues = mergeWithSavedSecrets({
          fieldValues: input.fieldValues,
          existing,
          schema: mcp.configSchema,
        });
      }
    }

    const result = await userMcpConfigDomain.commands.testMcpConnection({
      userId: context.userId,
      mcpId: input.mcpId,
      fieldValues,
      schema: mcp.configSchema,
      mcpSlug: mcp.slug,
    });

    return { success: result.success, error: result.error };
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof WrongParamError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: String(error) };
  }
};
