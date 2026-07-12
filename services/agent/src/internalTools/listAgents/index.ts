import agentDomain, { AgentStatus } from '@vassembly/domain-agent';
import systemAgentDomain, { AgentStatus as SystemAgentStatus } from '@vassembly/domain-system-agent';

import { listSystemAgentsBySpecializationIds } from './listSystemAgentsBySpecializationIds';
import { filterAgentsByRole, resolveAgentRoleFromArgs } from './filterAgentsByRole';
import { resolveSpecializationIds } from './resolveSpecializationIds';

import type { ListAgentRow, ListAgentsParams } from './types';

const LIST_PAGE = 0;
const LIST_SIZE = 50;

const mapPersonalAgentRow = (agent: {
  name?: string;
  description?: string;
  category?: string;
}): ListAgentRow => ({
  name: agent.name ?? '',
  description: agent.description,
  category: agent.category ?? null,
  agentType: 'personal',
});

const mapSystemAgentRow = (agent: {
  name: string;
  description?: string;
}): ListAgentRow => ({
  name: agent.name,
  description: agent.description,
  category: null,
  agentType: 'system',
});

const isTaskExecutionContext = (taskId: string): boolean => taskId !== '';

export const listAgents = async ({ args, context }: ListAgentsParams): Promise<string> => {
  const specializationIds = resolveSpecializationIds({ args, context });

  if (
    context.callerAgentType === 'system' &&
    isTaskExecutionContext(context.taskId) &&
    specializationIds === undefined
  ) {
    return JSON.stringify([]);
  }

  if (specializationIds !== undefined && context.callerAgentType === 'system') {
    const specializationAgents = await listSystemAgentsBySpecializationIds({ specializationIds });
    const role = resolveAgentRoleFromArgs(args);
    const filteredAgents = filterAgentsByRole({ agents: specializationAgents, role });

    return JSON.stringify(filteredAgents);
  }

  const personalResult = await agentDomain.queries.getListForUser({
    userId: context.userId,
    page: LIST_PAGE,
    size: LIST_SIZE,
    status: AgentStatus.Active,
  });

  const personalAgents = personalResult.items.map(mapPersonalAgentRow);

  if (context.callerAgentType === 'personal') {
    return JSON.stringify(personalAgents);
  }

  const systemResult = await systemAgentDomain.queries.getAdminList({
    page: LIST_PAGE,
    size: LIST_SIZE,
    status: SystemAgentStatus.Active,
  });

  const systemAgents = systemResult.items.map(mapSystemAgentRow);

  return JSON.stringify([...systemAgents, ...personalAgents]);
};
