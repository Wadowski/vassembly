import { removeSoftDb } from '@vassembly/commands';

import { AiIntegrationStatus } from '../../constants';
import { aiIntegrationMongodbDao } from '../../clients';
import { AiIntegrationCredentialModel, aiIntegrationCredentialFactory } from '../../model';
import { getById } from '../../queries';

import type { RemoveSoftAiIntegrationCommandInput } from './types';

const persistRemoveSoft = removeSoftDb<AiIntegrationCredentialModel>({
  dao: aiIntegrationMongodbDao,
  factory: aiIntegrationCredentialFactory,
  additionalPartial: () => ({ status: AiIntegrationStatus.Archived }),
});

export const removeSoft = async (input: RemoveSoftAiIntegrationCommandInput) => {
  await getById({ id: input.id, userId: input.userId });
  return persistRemoveSoft({ id: input.id });
};
