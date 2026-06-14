import { InternalToolAccessScope } from './types';

import type { InternalToolDefinition } from './types';

export const INTERNAL_TOOLS: InternalToolDefinition[] = [
  {
    id: 'use-agent',
    displayName: 'Use agent',
    description: 'Delegate to another agent by name',
    accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
    llmToolName: 'use_agent',
  },
  {
    id: 'list-agents',
    displayName: 'List agents',
    description: 'List agents visible to caller',
    accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
    llmToolName: 'list_agents',
  },
];

export const INTERNAL_TOOL_IDS = INTERNAL_TOOLS.map((tool) => tool.id);

const internalToolById = new Map(INTERNAL_TOOLS.map((tool) => [tool.id, tool]));

export const getAllInternalTools = (): InternalToolDefinition[] => [...INTERNAL_TOOLS];

export const getInternalToolById = (id: string): InternalToolDefinition | undefined =>
  internalToolById.get(id);

export interface IsToolEligibleForAgentTypeParams {
  tool: InternalToolDefinition;
  agentType: 'personal' | 'system';
}

export const isToolEligibleForAgentType = (
  toolOrParams: InternalToolDefinition | IsToolEligibleForAgentTypeParams,
  agentType?: 'personal' | 'system',
): boolean => {
  const tool = 'tool' in toolOrParams ? toolOrParams.tool : toolOrParams;
  const resolvedAgentType = 'agentType' in toolOrParams ? toolOrParams.agentType : agentType;

  if (!resolvedAgentType) {
    return false;
  }

  if (resolvedAgentType === 'system') {
    return true;
  }

  return tool.accessScope === InternalToolAccessScope.SYSTEM_AND_PERSONAL;
};

export const getInternalToolsForAgentType = ({
  agentType,
}: {
  agentType: 'personal' | 'system';
}): InternalToolDefinition[] =>
  getAllInternalTools().filter((tool) => isToolEligibleForAgentType(tool, agentType));
