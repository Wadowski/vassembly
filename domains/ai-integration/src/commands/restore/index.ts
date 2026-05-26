import { WrongParamError } from '@vassembly/errors';

import { AiIntegrationStatus } from '../../constants';
import { aiIntegrationMongodbDao } from '../../clients';
import { aiIntegrationCredentialFactory } from '../../model';
import { getModelById } from '../../queries';

import type { RestoreAiIntegrationCommandInput } from './types';

const NOT_ARCHIVED_MESSAGE = 'Restore requires archived credential';

export const restore = async (input: RestoreAiIntegrationCommandInput) => {
  const existing = await getModelById({ id: input.id, userId: input.userId });
  if (!existing.data.removedAt) {
    throw new WrongParamError(NOT_ARCHIVED_MESSAGE);
  }

  const where = aiIntegrationCredentialFactory.create({ id: input.id, userId: input.userId });
  const updatedInstance = aiIntegrationCredentialFactory.create({
    removedAt: null,
    status: AiIntegrationStatus.Active,
    updatedAt: new Date(),
  });

  await aiIntegrationMongodbDao.update(where, updatedInstance);
  return getModelById({ id: input.id, userId: input.userId });
};
