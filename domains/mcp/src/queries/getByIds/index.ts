import { ObjectId } from 'mongodb';

import { mcpMongodbDao } from '../../clients';
import { mcpFactory, toMcpResponse } from '../../model';
import type { McpModel } from '../../model';

import type { GetByIdsParams, GetByIdsResult } from './types';

const MONGODB_OBJECT_ID_HEX = /^[a-f\d]{24}$/i;

const buildIdFilter = ({ ids }: { ids: string[] }): Record<string, unknown> => {
  const objectIds = ids
    .filter((id) => MONGODB_OBJECT_ID_HEX.test(id))
    .map((id) => new ObjectId(id));
  const stringIds = ids.filter((id) => !MONGODB_OBJECT_ID_HEX.test(id));

  const conditions: Record<string, unknown>[] = [];

  if (objectIds.length > 0) {
    conditions.push({ _id: { $in: objectIds } });
  }

  if (stringIds.length > 0) {
    conditions.push({ _id: { $in: stringIds } });
  }

  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0]!;
  }

  return { $or: conditions };
};

export const getByIds = async ({ ids }: GetByIdsParams): Promise<GetByIdsResult> => {
  if (ids.length === 0) {
    return { items: [] };
  }

  const filter = buildIdFilter({ ids });
  const rows = await mcpMongodbDao.getManyRaw(filter);

  return {
    items: rows.map((row) =>
      toMcpResponse({
        mcp: mcpFactory.create(row as Partial<McpModel>),
      }),
    ),
  };
};

export type { GetByIdsParams, GetByIdsResult } from './types';
