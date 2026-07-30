import systemAgentDomain from '@vassembly/domain-system-agent';
import { resolveSpecializationAgentRole } from '@vassembly/service-agent';

export const resolvePlanItemAgentRole = async ({
  agentId,
}: {
  agentId: string;
}): Promise<'worker' | 'researcher' | 'validator'> => {
  const agentResult = await systemAgentDomain.queries.getModelById({ id: agentId });
  const role = resolveSpecializationAgentRole({ name: agentResult.data?.name ?? '' });

  if (role === 'researcher' || role === 'validator') {
    return role;
  }

  return 'worker';
};
