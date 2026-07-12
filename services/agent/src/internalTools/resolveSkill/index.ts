import skillDomain from '@vassembly/domain-skill';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { NotFoundError, ValidationError } from '@vassembly/errors';

import { runAutoScriptsFromRule } from '../runSkillScript';
import { resolveSkillComposition } from './resolveSkillComposition';

import type { ResolveSkillToolResult } from './types';
import type { InternalToolContext } from '../types';

const buildSkillNotFoundResult = ({
  skillName,
  message,
}: {
  skillName: string;
  message: string;
}): string =>
  JSON.stringify({
    error: 'skill_not_found',
    skillName,
    message,
  } satisfies ResolveSkillToolResult);

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

  let entry;

  try {
    entry = await skillDomain.queries.getActiveRuleByName({
      specializationId,
      skillName,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return buildSkillNotFoundResult({
        skillName,
        message: error.message,
      });
    }

    throw error;
  }

  const { name, rule: composedRule, scripts: allScripts } = await resolveSkillComposition({
    skillId: entry.skillId,
  });

  const autoRunResults = await runAutoScriptsFromRule({
    rule: composedRule,
    skillName: name,
    scripts: allScripts,
    specializationId,
    context,
  });

  return JSON.stringify({
    skillName: name,
    rule: composedRule,
    ...(autoRunResults.length > 0 ? { autoRunResults } : {}),
  } satisfies ResolveSkillToolResult);
};
