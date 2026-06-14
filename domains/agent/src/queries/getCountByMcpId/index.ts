import { agentMongodbDao } from '../../clients';

import type { GetCountByMcpIdInput } from './types';

export const getCountByMcpId = async (input: GetCountByMcpIdInput): Promise<number> => {
  const count = await agentMongodbDao.collection.countDocuments({
    userId: input.userId,
    assignedMcpIds: input.mcpId,
    removedAt: null,
  });

  return count;
};
