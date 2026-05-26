import { NotFoundError } from '@vassembly/errors';

import { aiIntegrationMongodbDao } from '../../clients';
import { aiIntegrationCredentialFactory } from '../../model';
import type { AiIntegrationCredentialModel } from '../../model';

import type { GetAiIntegrationByIdQueryInput } from '../getById/types';

const NOT_FOUND_MESSAGE = 'AI integration credential not found';

export const getModelById = async (
  input: GetAiIntegrationByIdQueryInput,
): Promise<{ data: AiIntegrationCredentialModel }> => {
  const where = aiIntegrationCredentialFactory.create({ id: input.id });
  const raw = await aiIntegrationMongodbDao.get(where);
  if (!raw || !raw.id) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }
  if (raw.userId !== input.userId) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }
  return { data: aiIntegrationCredentialFactory.create(raw) };
};
