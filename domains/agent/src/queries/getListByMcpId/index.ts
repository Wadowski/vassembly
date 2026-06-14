import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { agentMongodbDao } from '../../clients';
import { agentFactory } from '../../model';
import type { AgentModel } from '../../model';

import type { GetListByMcpIdInput, GetListByMcpIdResult } from './types';

const MAX_PAGE_SIZE = 50;

const QUERY_INPUT_SCHEMA = z.object({
  userId: z.string().min(1),
  mcpId: z.string().min(1),
  page: z.number().int().min(0).optional().default(0),
  size: z.number().int().min(1).optional().default(10),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

interface BuildFilterParams {
  userId: string;
  mcpId: string;
}

const buildFilter = (params: BuildFilterParams): Record<string, unknown> => ({
  userId: params.userId,
  assignedMcpIds: params.mcpId,
  removedAt: null,
});

export const getListByMcpId = async (input: GetListByMcpIdInput): Promise<GetListByMcpIdResult> => {
  const parsed = validateQueryInput(input);
  if (!parsed.success) {
    throw parsed.error;
  }

  const cappedSize = Math.min(parsed.data.size, MAX_PAGE_SIZE);
  const skip = parsed.data.page * cappedSize;
  const filter = buildFilter({
    userId: parsed.data.userId,
    mcpId: parsed.data.mcpId,
  });

  const [rows, totalCount] = await Promise.all([
    agentMongodbDao.getManyRaw(filter, {
      sort: { createdAt: -1 },
      offset: skip,
      limit: cappedSize,
    }),
    agentMongodbDao.collection.countDocuments(filter),
  ]);
  const items = rows.map((row) => agentFactory.create(row as Partial<AgentModel>));

  return { items, totalCount, page: parsed.data.page, size: cappedSize };
};
