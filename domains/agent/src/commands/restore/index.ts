import { WrongParamError } from '@vassembly/errors';

import { agentMongodbDao } from '../../clients';
import { agentFactory, AgentStatus } from '../../model';
import { getById } from '../../queries';

export interface RestoreAgentCommandInput {
  id: string;
  userId: string;
}

const NOT_DELETED_MESSAGE = 'Restore requires archived agent';

export const restore = async (input: RestoreAgentCommandInput) => {
  const existing = await getById({ id: input.id, userId: input.userId });
  if (!existing.data.removedAt) {
    throw new WrongParamError(NOT_DELETED_MESSAGE);
  }

  const where = agentFactory.create({ id: input.id, userId: input.userId });
  const updatedInstance = agentFactory.create({
    removedAt: null,
    status: AgentStatus.Active,
    updatedAt: new Date(),
  });

  await agentMongodbDao.update(where, updatedInstance);
  return getById({ id: input.id, userId: input.userId });
};
