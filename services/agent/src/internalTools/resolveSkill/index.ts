import skillDomain from '@vassembly/domain-skill';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

import type { ResolveSkillToolResult } from './types';
import type { InternalToolContext } from '../types';

export const resolveSkillToolHandler = async (
  args: Record<string, unknown>,
  context: InternalToolContext,
): Promise<string> => {
  const skillName = typeof args.skillName === 'string' ? args.skillName.trim() : '';

  if (!skillName) {
    throw new ValidationError('skillName is required');
  }

  let specializationId =
    typeof args.specializationId === 'string' ? args.specializationId.trim() : '';

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

  if (!specializationId) {
    throw new ValidationError('Cannot resolve skill: no specializationId available');
  }

  const { rule } = await skillDomain.queries.getActiveRuleByName({
    specializationId,
    skillName,
  });

  return JSON.stringify({
    skillName,
    rule,
  } satisfies ResolveSkillToolResult);
};
