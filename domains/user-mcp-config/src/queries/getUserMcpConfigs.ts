import { userMcpConfigDao } from '../clients/mongodb';
import { UserMcpConfigFactory } from '../model/factory';
import type { UserMcpConfigResponse } from '../types';

import { resolvePagination } from './shared/pagination';

export interface GetUserMcpConfigsInput {
  userId: string;
  page?: number;
  size?: number;
}

export interface GetUserMcpConfigsResult {
  items: UserMcpConfigResponse[];
  total: number;
  page: number;
  size: number;
}

export const getUserMcpConfigs = async (
  input: GetUserMcpConfigsInput,
): Promise<GetUserMcpConfigsResult> => {
  const { page, size, skip } = resolvePagination({
    page: input.page,
    size: input.size,
  });

  const paginatedResult = await userMcpConfigDao.getPaginatedListByUserId({
    userId: input.userId,
    skip,
    limit: size,
  });

  const items = paginatedResult.items.map((record) =>
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

  return {
    items,
    total: paginatedResult.total,
    page,
    size,
  };
};
