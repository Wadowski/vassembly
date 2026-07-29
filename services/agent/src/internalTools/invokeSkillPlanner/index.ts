import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import mcpDomain from '@vassembly/domain-mcp';
import skillDomain, { formatSkillsCatalogSection } from '@vassembly/domain-skill';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

import { findSimilarSkills } from '../findSimilarSkills';
import { resolveSpecializationReference } from '../resolveSpecializationReference';
import { resolveSpecializationMcpIds } from '../../helpers/resolveSpecializationMcpIds';
import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';
import { buildSkillPlannerMessage } from './buildSkillPlannerMessage';
import { parseSkillPlannerResult } from './parseSkillPlannerResult';

import type { InternalToolContext } from '../types';
import type { InvokeSkillPlannerToolResult } from './types';

const MCP_LIST_PAGE_SIZE = 500;

const formatSimilarSkillsSection = ({
  items,
}: {
  items: Array<{ name: string; description: string }>;
}): string => {
  if (items.length === 0) {
    return '';
  }

  const lines = items.map((item) => `- **${item.name}**: ${item.description}`);

  return `## Possibly similar skills (review before creating)\n\n${lines.join('\n')}`;
};

const resolveSkillByName = async ({
  specializationId,
  skillName,
}: {
  specializationId: string;
  skillName: string;
}): Promise<{ skillId: string; skillName: string }> => {
  const skillResult = await skillDomain.queries.getActiveRuleByName({
    specializationId,
    skillName,
  });

  return {
    skillId: skillResult.skillId,
    skillName,
  };
};

export const invokeSkillPlannerToolHandler = async (
  args: Record<string, unknown>,
  context: InternalToolContext,
): Promise<string> => {
  const specializationRef =
    typeof args.specializationId === 'string' ? args.specializationId.trim() : '';
  const goal = typeof args.goal === 'string' ? args.goal.trim() : '';

  if (!goal) {
    throw new ValidationError('goal is required');
  }

  const specialization = await resolveSpecializationReference({
    specializationRef,
    context,
    preferCallerSpecialization: true,
  });
  const specializationId = specialization.id;

  const mcpIdsOverride = await resolveSpecializationMcpIds({ specializationId });

  const mcpListResult = await mcpDomain.queries.getList({
    specializationId,
    page: 0,
    size: MCP_LIST_PAGE_SIZE,
  });

  const catalogResult = await skillDomain.queries.getCatalogBySpecializationId({ specializationId });
  const skillsCatalogSection =
    catalogResult.items.length > 0
      ? formatSkillsCatalogSection({ items: catalogResult.items })
      : undefined;
  const similarItems = findSimilarSkills({ items: catalogResult.items, query: goal });
  const similarSkillsSection =
    similarItems.length > 0 ? formatSimilarSkillsSection({ items: similarItems }) : undefined;

  const agentResult = await systemAgentDomain.queries.getActiveByName({
    name: SYSTEM_AGENT_NAME.SkillPlanner,
  });

  const invokeResult = await runAgentInvokeWithTools({
    userId: context.userId,
    agentType: 'system',
    agentId: agentResult.data.id!,
    message: buildSkillPlannerMessage({
      specializationName: specialization.name,
      specializationId,
      goal,
      mcpItems: mcpListResult.items.map((item) => ({
        slug: item.slug,
        name: item.name,
        description: item.description,
      })),
      skillsCatalogSection,
      similarSkillsSection,
    }),
    credentialScope: 'platform',
    mcpIdsOverride,
    toolContext: context,
  });

  const parsedResult = parseSkillPlannerResult({ message: invokeResult.message });

  if (parsedResult.action === 'reuse') {
    const resolvedSkill = await resolveSkillByName({
      specializationId,
      skillName: parsedResult.skillName,
    });

    return JSON.stringify({
      skillId: resolvedSkill.skillId,
      skillName: resolvedSkill.skillName,
      isNew: false,
      specializationId,
      action: 'reuse',
      refinements: parsedResult.refinements,
    } satisfies InvokeSkillPlannerToolResult);
  }

  if (parsedResult.action === 'compose') {
    const resolvedSkills = await Promise.all(
      parsedResult.skillNames.map((skillName) =>
        resolveSkillByName({ specializationId, skillName }),
      ),
    );
    const primarySkill = resolvedSkills[0];

    if (!primarySkill) {
      throw new ValidationError('Skill planner compose result did not include any skill names');
    }

    return JSON.stringify({
      skillId: primarySkill.skillId,
      skillName: primarySkill.skillName,
      isNew: false,
      specializationId,
      action: 'compose',
      composedSkillNames: resolvedSkills.map((skill) => skill.skillName),
    } satisfies InvokeSkillPlannerToolResult);
  }

  const skillResult = await skillDomain.queries.getModelById({ id: parsedResult.skillId });

  if (!skillResult.data.name) {
    throw new ValidationError('Created skill is missing a name');
  }

  return JSON.stringify({
    skillId: parsedResult.skillId,
    skillName: skillResult.data.name,
    isNew: parsedResult.isNew,
    specializationId,
    action: 'create',
  } satisfies InvokeSkillPlannerToolResult);
};
