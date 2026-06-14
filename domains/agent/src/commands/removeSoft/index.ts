import { removeSoftDb } from '@vassembly/commands';

import { agentMongodbDao } from '../../clients';
import { AgentModel, agentFactory, AgentStatus } from '../../model';
import { getModelById } from '../../queries';

export interface RemoveSoftAgentCommandInput {
  id: string;
  userId: string;
}

const persistRemoveSoft = removeSoftDb<AgentModel>({
  dao: agentMongodbDao,
  factory: agentFactory,
  additionalPartial: () => ({ status: AgentStatus.Archived }),
});

export const removeSoft = async (input: RemoveSoftAgentCommandInput) => {
  await getModelById({ id: input.id, userId: input.userId });
  return persistRemoveSoft({ id: input.id });
};
