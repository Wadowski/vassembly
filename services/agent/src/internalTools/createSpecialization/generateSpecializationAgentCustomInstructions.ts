import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import mcpDomain from '@vassembly/domain-mcp';
import systemAgentDomain from '@vassembly/domain-system-agent';

import { resolveSpecializationMcpIds } from '../../helpers/resolveSpecializationMcpIds';
import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';
import {
  SPECIALIZATION_AGENT_ROLES,
  SPECIALIZATION_PROVISIONING_ADMIN_ID,
} from './constants';
import { logSpecializationEvent } from './logSpecializationEvent';

import type { SpecializationAgentRole } from './constants';
import type { InternalToolContext } from '../types';

const MCP_LIST_PAGE_SIZE = 500;

export interface GenerateSpecializationAgentCustomInstructionsParams {
  agentIds: string[];
  specializationName: string;
  specializationDescription: string;
  specializationId: string;
  userId: string;
  toolContext: InternalToolContext;
}

const normalizeCustomInstructions = ({ rawOutput }: { rawOutput: string }): string | null => {
  const trimmed = rawOutput.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^["']|["']$/g, '');
};

const resolveAgentRole = ({ agentName }: { agentName: string }): SpecializationAgentRole | null => {
  const normalizedName = agentName.trim().toLowerCase();

  for (const role of SPECIALIZATION_AGENT_ROLES) {
    if (normalizedName.endsWith(` ${role}`)) {
      return role;
    }
  }

  return null;
};

const resolveMcpNames = async ({
  specializationId,
}: {
  specializationId: string;
}): Promise<string> => {
  const mcpIds = await resolveSpecializationMcpIds({ specializationId });

  if (mcpIds.length === 0) {
    return 'none';
  }

  const mcpListResult = await mcpDomain.queries.getList({
    specializationId,
    page: 0,
    size: MCP_LIST_PAGE_SIZE,
  });

  const names = mcpListResult.items.map((item) => item.name).filter((name) => name.length > 0);

  return names.length > 0 ? names.join(', ') : 'none';
};

export const generateSpecializationAgentCustomInstructions = async ({
  agentIds,
  specializationName,
  specializationDescription,
  specializationId,
  userId,
  toolContext,
}: GenerateSpecializationAgentCustomInstructionsParams): Promise<void> => {
  const ruleGeneratorResult = await systemAgentDomain.queries.getActiveByName({
    name: SYSTEM_AGENT_NAME.SpecializationAgentRuleGenerator,
  });
  const mcpNames = await resolveMcpNames({ specializationId });

  await Promise.all(
    agentIds.map(async (agentId) => {
      try {
        const agentResult = await systemAgentDomain.queries.getModelById({ id: agentId });
        const agentName = agentResult.data?.name;

        if (!agentName) {
          return;
        }

        const role = resolveAgentRole({ agentName });

        if (!role) {
          return;
        }

        const invokeResult = await runAgentInvokeWithTools({
          userId,
          agentType: 'system',
          agentId: ruleGeneratorResult.data.id!,
          message: [
            `Specialization: ${specializationName}`,
            `Specialization description: ${specializationDescription}`,
            `Agent role: ${role}`,
            `Agent name: ${agentName}`,
            `Assigned MCPs: ${mcpNames}`,
          ].join('\n'),
          credentialScope: 'platform',
          toolContext,
        });

        const customInstructions = normalizeCustomInstructions({ rawOutput: invokeResult.message });

        if (!customInstructions) {
          return;
        }

        await systemAgentDomain.commands.update({
          id: agentId,
          updatedByAdminId: SPECIALIZATION_PROVISIONING_ADMIN_ID,
          data: { customInstructions },
        });
      } catch (error) {
        logSpecializationEvent({
          event: 'specialization.agent.customInstructions.failed',
          specializationId,
          userId,
          reason: error instanceof Error ? error.message : String(error),
          agentName: agentId,
        });
      }
    }),
  );
};
