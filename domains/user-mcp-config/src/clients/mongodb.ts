import { mongoDb } from '@vassembly/client-mongodb';

import { UserMcpConfigFactory } from '../model/factory';
import type { UserMcpConfigModel } from '../model/model';
import type { StoredUserMcpConfigRecord } from '../commands/shared/toModel';

const USER_MCP_CONFIG_COLLECTION = 'userMcpConfigs';

export async function setupUserMcpConfigIndexes(): Promise<void> {
  const collection = mongoDb.db.collection(USER_MCP_CONFIG_COLLECTION);

  await collection.createIndex({ userId: 1, mcpId: 1 }, { unique: true });
  await collection.createIndex({ userId: 1 });
  await collection.createIndex({ mcpId: 1 });
  await collection.createIndex({ userId: 1, updatedAt: -1 });
  await collection.createIndex({ lastTestedAt: -1 });
}

export class UserMcpConfigDAO {
  private get collection() {
    return mongoDb.db.collection(USER_MCP_CONFIG_COLLECTION);
  }

  async create(params: { model: StoredUserMcpConfigRecord }): Promise<StoredUserMcpConfigRecord> {
    const now = new Date();
    const doc = UserMcpConfigFactory.toPersistence({
      model: UserMcpConfigFactory.fromPersistence({
        doc: {
          ...params.model,
          createdAt: params.model.createdAt ?? now,
          updatedAt: params.model.updatedAt ?? now,
        },
      }),
    });

    await this.collection.insertOne(doc);

    return {
      ...params.model,
      createdAt: params.model.createdAt ?? now,
      updatedAt: params.model.updatedAt ?? now,
    };
  }

  async getByUserAndMcpId(params: {
    userId: string;
    mcpId: string;
  }): Promise<StoredUserMcpConfigRecord | null> {
    const doc = await this.collection.findOne({ userId: params.userId, mcpId: params.mcpId });

    if (!doc) {
      return null;
    }

    return this.toStoredRecord({ doc });
  }

  async getByMcpId(params: { mcpId: string }): Promise<StoredUserMcpConfigRecord | null> {
    const doc = await this.collection.findOne({ mcpId: params.mcpId });

    if (!doc) {
      return null;
    }

    return this.toStoredRecord({ doc });
  }

  async getListByUserId(params: { userId: string }): Promise<StoredUserMcpConfigRecord[]> {
    const docs = await this.collection
      .find({ userId: params.userId })
      .sort({ updatedAt: -1 })
      .toArray();

    return docs.map((doc) => this.toStoredRecord({ doc }));
  }

  async update(params: { model: StoredUserMcpConfigRecord }): Promise<StoredUserMcpConfigRecord> {
    const now = new Date();
    const model = UserMcpConfigFactory.fromPersistence({
      doc: {
        ...params.model,
        updatedAt: now,
      },
    });
    const doc = UserMcpConfigFactory.toPersistence({ model });

    await this.collection.updateOne({ userId: params.model.userId, mcpId: params.model.mcpId }, { $set: doc });

    return {
      ...params.model,
      updatedAt: now,
    };
  }

  async remove(params: { userId: string; mcpId: string }): Promise<boolean> {
    const result = await this.collection.deleteOne({ userId: params.userId, mcpId: params.mcpId });
    return result.deletedCount > 0;
  }

  private toStoredRecord({ doc }: { doc: Record<string, unknown> }): StoredUserMcpConfigRecord {
    const model: UserMcpConfigModel = UserMcpConfigFactory.fromPersistence({ doc });

    return {
      id: model.id ?? '',
      userId: model.userId,
      mcpId: model.mcpId,
      fieldValues: model.fieldValues,
      status: model.status,
      enabled: model.enabled ?? true,
      lastTestedAt: model.lastTestedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}

export const userMcpConfigDao = new UserMcpConfigDAO();
