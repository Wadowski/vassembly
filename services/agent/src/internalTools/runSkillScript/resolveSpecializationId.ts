import systemAgentDomain from '@vassembly/domain-system-agent';

import type { InternalToolContext } from '../types';

export interface ResolveSpecializationIdParams {
  specializationIdArg?: string;
  context: InternalToolContext;
}

export const resolveSpecializationId = async ({
  specializationIdArg,
  context,
}: ResolveSpecializationIdParams): Promise<string> => {
  let specializationId = specializationIdArg?.trim() ?? '';

  if (!specializationId) {
    const { data: callerAgent } = await systemAgentDomain.queries.getActiveById({
      id: context.callerAgentId,
    });
    specializationId = callerAgent?.specializationId ?? '';
  }

  if (!specializationId && context.parentAgentId) {
    const { data: parentAgent } = await systemAgentDomain.queries.getActiveById({
      id: context.parentAgentId,
    });
    specializationId = parentAgent?.specializationId ?? '';
  }

  if (!specializationId) {
    const contextSpecializationId = context.specializationIds?.[0];
    specializationId =
      typeof contextSpecializationId === 'string' ? contextSpecializationId.trim() : '';
  }

  return specializationId;
};
