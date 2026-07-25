import { McpConfigFieldType } from './configSchema';
import type { McpConfigSchema } from './configSchema';
import type { UserMcpConfigModel } from './model';
import type { UserMcpConfigFieldValueResponse, UserMcpConfigResponse } from '../types';

export interface ToUserMcpConfigResponseParams {
  model: UserMcpConfigModel;
  configSchema?: McpConfigSchema;
}

const getPasswordFieldKeys = ({ configSchema }: { configSchema?: McpConfigSchema }): Set<string> => {
  if (!configSchema) {
    return new Set();
  }

  return new Set(
    configSchema.fields
      .filter((field) => field.type === McpConfigFieldType.Password)
      .map((field) => field.key),
  );
};

const mapFieldValuesToResponse = ({
  fieldValues,
  passwordFieldKeys,
}: {
  fieldValues: Record<string, string | boolean>;
  passwordFieldKeys: Set<string>;
}): UserMcpConfigFieldValueResponse[] => {
  return Object.entries(fieldValues).map(([key, value]) => {
    if (passwordFieldKeys.has(key)) {
      const hasSecret = value !== undefined && value !== null && value !== '';
      return { key, ...(hasSecret ? { hasSecret: true } : {}) };
    }

    return { key, value };
  });
};

export const toUserMcpConfigResponse = ({
  model,
  configSchema,
}: ToUserMcpConfigResponseParams): UserMcpConfigResponse => {
  const passwordFieldKeys = getPasswordFieldKeys({ configSchema });

  return {
    id: model.id ?? '',
    userId: model.userId,
    mcpId: model.mcpId,
    fieldValues: mapFieldValuesToResponse({
      fieldValues: model.fieldValues ?? {},
      passwordFieldKeys,
    }),
    status: model.status,
    enabled: model.enabled,
    lastTestedAt: model.lastTestedAt?.toISOString(),
    createdAt: model.createdAt?.toISOString() ?? '',
    updatedAt: model.updatedAt?.toISOString() ?? '',
  };
};
