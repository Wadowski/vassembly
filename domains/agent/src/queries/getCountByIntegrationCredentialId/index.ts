import { agentMongodbDao } from '../../clients';

import type { GetCountByIntegrationCredentialIdInput } from './types';

export const getCountByIntegrationCredentialId = async (
  input: GetCountByIntegrationCredentialIdInput,
): Promise<number> => {
  const count = await agentMongodbDao.collection.countDocuments({
    integrationCredentialId: input.credentialId,
    removedAt: null,
  });

  return count;
};
