import { AgentCategory } from '@vassembly/domain-system-agent';
import systemAgentDomain from '@vassembly/domain-system-agent';

import {
  SPECIALIZATION_AGENT_ROLES,
  SPECIALIZATION_AGENT_RULES,
  SPECIALIZATION_AGENT_TOOL_IDS,
  SPECIALIZATION_PROVISIONING_ADMIN_ID,
} from './constants';
import { logSpecializationEvent } from './logSpecializationEvent';

import type { SpecializationAgentRole } from './constants';

export interface ProvisionSpecializationAgentsParams {
  specializationId: string;
  specializationName: string;
}

export interface ProvisionSpecializationAgentsResult {
  createdAgentIds: string[];
}

const toTitleCase = ({ value }: { value: string }): string =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const buildAgentName = ({
  specializationName,
  role,
}: {
  specializationName: string;
  role: SpecializationAgentRole;
}): string => `${toTitleCase({ value: specializationName })} ${role}`;

const hasRoleAgent = ({
  agentNames,
  specializationName,
  role,
}: {
  agentNames: string[];
  specializationName: string;
  role: SpecializationAgentRole;
}): boolean => {
  const expectedName = buildAgentName({ specializationName, role }).toLowerCase();

  return agentNames.some((name) => name.toLowerCase() === expectedName);
};

export const provisionSpecializationAgents = async ({
  specializationId,
  specializationName,
}: ProvisionSpecializationAgentsParams): Promise<ProvisionSpecializationAgentsResult> => {
  const createdAgentIds: string[] = [];
  const existingAgents = await systemAgentDomain.queries.getBySpecializationId({
    specializationId,
  });
  const existingNames = existingAgents.items
    .map((agent) => agent.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);

  for (const role of SPECIALIZATION_AGENT_ROLES) {
    const agentName = buildAgentName({ specializationName, role });

    if (hasRoleAgent({ agentNames: existingNames, specializationName, role })) {
      logSpecializationEvent({
        event: 'specialization.agent.skipped',
        specializationId,
        role,
        agentName,
        reason: 'already_exists',
      });
      continue;
    }

    try {
      const createResult = await systemAgentDomain.commands.create({
        name: agentName,
        rule: SPECIALIZATION_AGENT_RULES[role],
        category: AgentCategory.Utility,
        specializationId,
        assignedToolIds: [...SPECIALIZATION_AGENT_TOOL_IDS],
        createdByAdminId: SPECIALIZATION_PROVISIONING_ADMIN_ID,
        updatedByAdminId: SPECIALIZATION_PROVISIONING_ADMIN_ID,
      });

      if (createResult.data.id) {
        createdAgentIds.push(createResult.data.id);
      }

      logSpecializationEvent({
        event: 'specialization.agent.provisioned',
        specializationId,
        role,
        agentName,
      });
    } catch (error) {
      logSpecializationEvent({
        event: 'specialization.agent.failed',
        specializationId,
        role,
        agentName,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { createdAgentIds };
};
