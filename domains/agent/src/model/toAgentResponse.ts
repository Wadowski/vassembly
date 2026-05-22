import type { AgentResponse } from './dto';
import type { AgentModel } from './model';

export const toAgentResponse = (agent: AgentModel): AgentResponse => {
  return {
    id: agent.id,
    name: agent.name,
    category: agent.category,
    description: agent.description,
    rule: agent.rule,
    userId: agent.userId,
    status: agent.status,
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
    removedAt: agent.removedAt ?? null,
  };
};
