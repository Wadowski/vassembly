import {
  formatInternalToolDisplayName,
  formatInternalToolId,
} from './formatInternalToolName';
import { InternalToolAccessScope } from './types';

import type { InternalToolDefinition } from './types';

interface DefineInternalToolParams {
  domain: string;
  action: string;
  description: string;
  accessScope: InternalToolAccessScope;
  llmToolName: string;
}

const defineInternalTool = ({
  domain,
  action,
  description,
  accessScope,
  llmToolName,
}: DefineInternalToolParams): InternalToolDefinition => ({
  id: formatInternalToolId({ domain, action }),
  displayName: formatInternalToolDisplayName({ domain, action }),
  description,
  accessScope,
  llmToolName,
});

export const INTERNAL_TOOLS: InternalToolDefinition[] = [
  defineInternalTool({
    domain: 'agent',
    action: 'use',
    description: 'Delegate to another agent by name',
    accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
    llmToolName: 'use_agent',
  }),
  defineInternalTool({
    domain: 'agent',
    action: 'list',
    description:
      'List agents visible to caller. Optionally filter by specializationIds to return agents linked to those specializations.',
    accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
    llmToolName: 'list_agents',
  }),
  defineInternalTool({
    domain: 'task',
    action: 'update',
    description: 'Persist title and/or category for a task by its ID',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'update_task',
  }),
  defineInternalTool({
    domain: 'user',
    action: 'ask',
    description:
      'Ask the task creator one or more questions. Execution pauses until all pending questions are answered.',
    accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
    llmToolName: 'ask_user',
  }),
  defineInternalTool({
    domain: 'specialization',
    action: 'classify',
    description:
      'Classify a task description into 1–3 specialization domains. Returns existing IDs or a signal to create a new specialization.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'classify_specialization',
  }),
  defineInternalTool({
    domain: 'specialization',
    action: 'create',
    description:
      'Provision a new specialization domain: creates the entity, provisions researcher/worker/validator agents, and maps relevant MCPs.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'create_specialization',
  }),
  defineInternalTool({
    domain: 'skill',
    action: 'create',
    description:
      'Create a skill for a specialization with name, description, rule, and optional scripts.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'create_skill',
  }),
  defineInternalTool({
    domain: 'skill',
    action: 'resolve',
    description:
      'Resolve the full rule text for a named skill in a specialization domain.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'resolve_skill',
  }),
  defineInternalTool({
    domain: 'web',
    action: 'search',
    description: 'Search the web and return a list of results (title, URL, and snippet)',
    accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
    llmToolName: 'web_search',
  }),
  defineInternalTool({
    domain: 'web',
    action: 'page-content',
    description:
      'Fetch a web page and return its main text content, plus links to any images and videos found',
    accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
    llmToolName: 'web_page_content',
  }),
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
