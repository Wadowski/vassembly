import { assertRequiredFields, toIsoString, toNullableIsoString } from '@vassembly/mappers';

import type { AgentResponse } from './dto';
import type { AgentModel } from './model';

const REQUIRED_FIELDS = ['id', 'name', 'userId', 'status', 'createdAt', 'updatedAt'] as const;

export interface ToAgentResponseParams {
  agent: AgentModel;
}

export const toAgentResponse = ({ agent }: ToAgentResponseParams): AgentResponse => {
  assertRequiredFields({
    entity: agent,
    fields: REQUIRED_FIELDS,
    entityName: 'Agent',
  });

  return {
    id: agent.id!,
    name: agent.name!,
    category: agent.category,
    description: agent.description,
    rule: agent.rule,
    userId: agent.userId!,
    status: agent.status!,
    integrationCredentialId: agent.integrationCredentialId,
    assignedMcpIds: agent.assignedMcpIds ?? [],
    createdAt: toIsoString({ value: agent.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: agent.updatedAt!, fieldName: 'updatedAt' }),
    removedAt: toNullableIsoString(agent.removedAt),
  };
};
