import { NotFoundError } from '@vassembly/errors';

import { agentMongodbDao } from '../clients';
import { agentFactory } from '../model';
import type { AgentModel } from '../model';

import type { GetAgentByIdQueryInput } from './getById.types';

const NOT_FOUND_MESSAGE = 'Agent not found';

export const getById = async (input: GetAgentByIdQueryInput): Promise<{ data: AgentModel }> => {
  const where = agentFactory.create({ id: input.id });
  const raw = await agentMongodbDao.get(where);
  if (!raw || !raw.id) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }
  if (input.userId !== undefined && raw.userId !== input.userId) {
    throw new NotFoundError(NOT_FOUND_MESSAGE);
  }
  return { data: agentFactory.create(raw) };
};
