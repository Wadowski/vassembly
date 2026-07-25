import { USER_MCP_CONFIG_STATUS } from '../constants';
import type { CreateUserMcpConfigInput, UserMcpConfigResponse } from '../types';
import { toUserMcpConfigResponse } from './mapper';
import type { McpConfigSchema } from './configSchema';
import { UserMcpConfigModel } from './model';

export interface ToUserMcpConfigDtoParams {
  model: UserMcpConfigModel;
  configSchema?: McpConfigSchema;
}

export class UserMcpConfigFactory {
  static fromDTO({ input, userId }: { input: CreateUserMcpConfigInput; userId: string }): UserMcpConfigModel {
    const model = new UserMcpConfigModel();
    model.userId = userId;
    model.mcpId = input.mcpId;
    model.fieldValues = { ...input.fieldValues };
    model.status = USER_MCP_CONFIG_STATUS.Configured;
    model.enabled = true;
    return model;
  }

  static toDTO({ model, configSchema }: ToUserMcpConfigDtoParams): UserMcpConfigResponse {
    return toUserMcpConfigResponse({ model, configSchema });
  }

  static toPersistence({ model }: { model: UserMcpConfigModel }): Record<string, unknown> {
    return {
      _id: model.id,
      userId: model.userId,
      mcpId: model.mcpId,
      fieldValues: model.fieldValues,
      status: model.status,
      enabled: model.enabled,
      lastTestedAt: model.lastTestedAt,
      lastConnectionError: model.lastConnectionError,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      removedAt: model.removedAt,
    };
  }

  static fromPersistence({ doc }: { doc: Record<string, unknown> }): UserMcpConfigModel {
    const model = new UserMcpConfigModel();
    const documentId = doc._id ?? doc.id;

    if (documentId !== undefined && documentId !== null) {
      model.id = String(documentId);
    }

    model.userId = doc.userId as string;
    model.mcpId = doc.mcpId as string;
    model.fieldValues = (doc.fieldValues as Record<string, string | boolean>) ?? {};
    model.status = doc.status as UserMcpConfigModel['status'];
    model.enabled = doc.enabled === undefined ? true : Boolean(doc.enabled);
    model.lastTestedAt = doc.lastTestedAt ? new Date(doc.lastTestedAt as string | Date) : undefined;
    model.lastConnectionError = (doc.lastConnectionError as string | null | undefined) ?? undefined;
    model.createdAt = doc.createdAt ? new Date(doc.createdAt as string | Date) : undefined;
    model.updatedAt = doc.updatedAt ? new Date(doc.updatedAt as string | Date) : undefined;
    model.removedAt = doc.removedAt ? new Date(doc.removedAt as string | Date) : doc.removedAt === null ? null : undefined;

    return model;
  }
}
