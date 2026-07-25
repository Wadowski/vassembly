import { mcpUsageMongodbDao } from '../../clients';
import { mcpUsageEventFactory, toMcpUsageEventResponse } from '../../model';
import type { McpUsageEventModel } from '../../model';
import { resolvePagination } from '../shared/pagination';

import type { GetListByMcpIdParams, GetListByMcpIdResult } from './types';

export const getListByMcpId = async ({
  mcpId,
  userId,
  page,
  size,
}: GetListByMcpIdParams): Promise<GetListByMcpIdResult> => {
  const { page: resolvedPage, size: resolvedSize, skip } = resolvePagination({ page, size });
  const filter = { mcpId, userId };

  const [rows, total] = await Promise.all([
    mcpUsageMongodbDao.getManyRaw(filter, {
      sort: { startedAt: -1 },
      offset: skip,
      limit: resolvedSize,
    }),
    mcpUsageMongodbDao.collection.countDocuments(filter),
  ]);

  const items = rows.map((row) =>
    toMcpUsageEventResponse({
      event: mcpUsageEventFactory.create(row as Partial<McpUsageEventModel>),
    }),
  );

  return { items, total, page: resolvedPage, size: resolvedSize };
};
