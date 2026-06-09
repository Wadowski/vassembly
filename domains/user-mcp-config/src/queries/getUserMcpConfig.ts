import { userMcpConfigDao } from '../clients/mongodb';
import { McpConfigFieldType } from '../model/configSchema';
import type { McpConfigSchema } from '../model/configSchema';
import type { UserMcpConfigFieldValueResponse, UserMcpConfigResponse } from '../types';
import { isEncryptedValue } from '../commands/shared/isEncryptedValue';

export interface GetUserMcpConfigInput {
  userId: string;
  mcpId: string;
  configSchema?: McpConfigSchema;
}

const mapFieldValues = ({
  fieldValues,
  configSchema,
}: {
  fieldValues: Record<string, string | boolean>;
  configSchema?: McpConfigSchema;
}): UserMcpConfigFieldValueResponse[] => {
  const passwordKeys = new Set(
    configSchema?.fields
      .filter((field) => field.type === McpConfigFieldType.Password)
      .map((field) => field.key) ?? [],
  );

  return Object.entries(fieldValues).map(([key, value]) => {
    const isPasswordField = passwordKeys.has(key) || isEncryptedValue({ value });

    if (isPasswordField) {
      const hasSecret = value !== undefined && value !== null && value !== '';
      return { key, ...(hasSecret ? { hasSecret: true } : {}) };
    }

    return { key, value };
  });
};

export const getUserMcpConfig = async (
  input: GetUserMcpConfigInput,
): Promise<UserMcpConfigResponse | null> => {
  const { userId, mcpId, configSchema } = input;

  const record = await userMcpConfigDao.getByUserAndMcpId({ userId, mcpId });

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userId: record.userId,
    mcpId: record.mcpId,
    fieldValues: mapFieldValues({
      fieldValues: record.fieldValues,
      configSchema,
    }),
    status: record.status,
    lastTestedAt: record.lastTestedAt?.toISOString(),
    createdAt: record.createdAt?.toISOString() ?? '',
    updatedAt: record.updatedAt?.toISOString() ?? '',
  };
};
