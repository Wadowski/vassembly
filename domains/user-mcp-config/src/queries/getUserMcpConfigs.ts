import { userMcpConfigDao } from '../clients/mongodb';
import { UserMcpConfigFactory } from '../model/factory';
import type { UserMcpConfigResponse } from '../types';

export interface GetUserMcpConfigsInput {
  userId: string;
  limit?: number;
}

const DEFAULT_LIST_LIMIT = 50;

export const getUserMcpConfigs = async (
  input: GetUserMcpConfigsInput,
): Promise<UserMcpConfigResponse[]> => {
  const { userId, limit = DEFAULT_LIST_LIMIT } = input;

  const models = await userMcpConfigDao.getListByUserId({ userId });

  return models.slice(0, limit).map((record) =>
    UserMcpConfigFactory.toDTO({
      model: UserMcpConfigFactory.fromPersistence({
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
      }),
    }),
  );
};
