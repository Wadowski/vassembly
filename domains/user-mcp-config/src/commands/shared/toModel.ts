import { UserMcpConfigFactory } from '../../model/factory';
import type { UserMcpConfigModel } from '../../model/model';

export interface StoredUserMcpConfigRecord {
  id: string;
  userId: string;
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
  status: UserMcpConfigModel['status'];
  enabled: boolean;
  lastTestedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const toStoredRecord = ({ model }: { model: UserMcpConfigModel }): StoredUserMcpConfigRecord => ({
  id: model.id ?? '',
  userId: model.userId,
  mcpId: model.mcpId,
  fieldValues: model.fieldValues,
  status: model.status,
  enabled: model.enabled,
  lastTestedAt: model.lastTestedAt,
  createdAt: model.createdAt,
  updatedAt: model.updatedAt,
});

export const toModel = ({ record }: { record: StoredUserMcpConfigRecord }): UserMcpConfigModel =>
  UserMcpConfigFactory.fromPersistence({
    doc: {
      id: record.id,
      userId: record.userId,
      mcpId: record.mcpId,
      fieldValues: record.fieldValues,
      status: record.status,
      enabled: record.enabled,
      lastTestedAt: record.lastTestedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    },
  });
