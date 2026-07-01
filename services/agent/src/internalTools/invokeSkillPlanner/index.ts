import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import mcpDomain from '@vassembly/domain-mcp';
import skillDomain, { formatSkillsCatalogSection } from '@vassembly/domain-skill';
import specializationDomain from '@vassembly/domain-specialization';
import systemAgentDomain from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

import { runAgentInvokeWithTools } from '../runAgentInvokeWithTools';
import { buildSkillPlannerMessage } from './buildSkillPlannerMessage';
import { parseSkillPlannerResult } from './parseSkillPlannerResult';

import type { InternalToolContext } from '../types';
import type { InvokeSkillPlannerToolResult } from './types';

const MCP_LIST_PAGE_SIZE = 500;

export const invokeSkillPlannerToolHandler = async (
  args: Record<string, unknown>,
  context: InternalToolContext,
): Promise<string> => {
  const specializationId =
    typeof args.specializationId === 'string' ? args.specializationId.trim() : '';
  const goal = typeof args.goal === 'string' ? args.goal.trim() : '';

  if (!specializationId) {
    throw new ValidationError('specializationId is required');
  }

  if (!goal) {
    throw new ValidationError('goal is required');
  }

  const specializationResult = await specializationDomain.queries.getById({ id: specializationId });

  const mcpListResult = await mcpDomain.queries.getList({
    specializationId,
    page: 0,
    size: MCP_LIST_PAGE_SIZE,
  });

  const mcpIdsOverride = mcpListResult.items.map((item) => item.id);

  const catalogResult = await skillDomain.queries.getCatalogBySpecializationId({ specializationId });
  const skillsCatalogSection =
    catalogResult.items.length > 0
      ? formatSkillsCatalogSection({ items: catalogResult.items })
      : undefined;

  const agentResult = await systemAgentDomain.queries.getActiveByName({
    name: SYSTEM_AGENT_NAME.SkillPlanner,
  });

  const invokeResult = await runAgentInvokeWithTools({
    userId: context.userId,
    agentType: 'system',
    agentId: agentResult.data.id!,
    message: buildSkillPlannerMessage({
      specializationName: specializationResult.data.name,
      specializationId,
      goal,
      mcpItems: mcpListResult.items.map((item) => ({
        slug: item.slug,
        name: item.name,
        description: item.description,
      })),
      skillsCatalogSection,
    }),
    credentialScope: 'platform',
    mcpIdsOverride,
    toolContext: context,
  });

  const parsedResult = parseSkillPlannerResult({ message: invokeResult.message });
  const skillResult = await skillDomain.queries.getModelById({ id: parsedResult.skillId });

  if (!skillResult.data.name) {
    throw new ValidationError('Created skill is missing a name');
  }

  return JSON.stringify({
    skillId: parsedResult.skillId,
    skillName: skillResult.data.name,
    isNew: parsedResult.isNew,
    specializationId,
  } satisfies InvokeSkillPlannerToolResult);
};
