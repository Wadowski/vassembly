import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import systemAgentDomain from '@vassembly/domain-system-agent';

import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';
import { SPECIALIZATION_PROVISIONING_ADMIN_ID } from './constants';
import { logSpecializationEvent } from './logSpecializationEvent';

import type { InternalToolContext } from '../types';

export interface GenerateSpecializationAgentDescriptionsParams {
  agentIds: string[];
  specializationName: string;
  specializationId: string;
  userId: string;
  toolContext: InternalToolContext;
}

const normalizeDescription = ({ rawOutput }: { rawOutput: string }): string | null => {
  const trimmed = rawOutput.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^["']|["']$/g, '');
};

export const generateSpecializationAgentDescriptions = async ({
  agentIds,
  specializationName,
  specializationId,
  userId,
  toolContext,
}: GenerateSpecializationAgentDescriptionsParams): Promise<void> => {
  const descriptionGeneratorResult = await systemAgentDomain.queries.getActiveByName({
    name: SYSTEM_AGENT_NAME.SpecializationAgentDescriptionGenerator,
  });

  await Promise.all(
    agentIds.map(async (agentId) => {
      try {
        const agentResult = await systemAgentDomain.queries.getModelById({ id: agentId });
        const agentName = agentResult.data?.name;

        if (!agentName) {
          return;
        }

        const invokeResult = await runAgentInvokeWithTools({
          userId,
          agentType: 'system',
          agentId: descriptionGeneratorResult.data.id!,
          message: `Agent name: ${agentName}\nSpecialization: ${specializationName}`,
          credentialScope: 'platform',
          toolContext,
        });

        const description = normalizeDescription({ rawOutput: invokeResult.message });

        if (!description) {
          return;
        }

        await systemAgentDomain.commands.update({
          id: agentId,
          updatedByAdminId: SPECIALIZATION_PROVISIONING_ADMIN_ID,
          data: { description },
        });
      } catch (error) {
        logSpecializationEvent({
          event: 'specialization.agent.description.failed',
          specializationId,
          userId,
          reason: error instanceof Error ? error.message : String(error),
          agentName: agentId,
        });
      }
    }),
  );
};
