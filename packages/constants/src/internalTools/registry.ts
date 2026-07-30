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
    description:
      'Persist title, category, or specializationIds for the current task. taskId is optional during task execution — it is taken from execution context.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'update_task',
  }),
  defineInternalTool({
    domain: 'task-plan',
    action: 'persist',
    description:
      'Persist the composed plan. Required top-level fields: shortName, description, inputDetails, outputDetails, resolvedInputDetails, items[]. Each item needs agentName (exact name from Available agents — worker, researcher, or validator), skillId (existing skill id, or null), skillName (existing skill name to reuse when skillId is null; omit to define a new skill via description), description, order. Do not use placeholder agent names or MongoDB ids for agents.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'persist_task_plan',
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
      'Classify a task description into up to 5 specialization domains (subject-matter and tool/platform). Returns existing IDs and/or new specialization entries to create.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'classify_specialization',
  }),
  defineInternalTool({
    domain: 'specialization',
    action: 'create',
    description:
      'Provision a new specialization domain: creates the entity, provisions methodologist/researcher/worker/validator agents, and maps relevant MCPs.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'create_specialization',
  }),
  defineInternalTool({
    domain: 'skill',
    action: 'create',
    description:
      'Create a skill for a specialization with name, description, input, output, rule, and optional scripts.',
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
    domain: 'skill',
    action: 'run-script',
    description:
      'Execute a bundled script for a named skill in an isolated sandbox and return stdout, stderr, and exit code.',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'run_skill_script',
  }),
  defineInternalTool({
    domain: 'skill',
    action: 'plan',
    description:
      'Invoke the Skill planner to create a new skill when no existing skill fits the goal',
    accessScope: InternalToolAccessScope.SYSTEM_ONLY,
    llmToolName: 'invoke_skill_planner',
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
