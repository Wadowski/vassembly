import { describe, expect, it } from 'vitest';

import {
  getAllInternalTools,
  getInternalToolById,
  isToolEligibleForAgentType,
} from './registry';

import type { InternalToolDefinition } from './types';
import { InternalToolAccessScope } from './types';

const REQUIRED_FIELD_KEYS = [
  'id',
  'displayName',
  'description',
  'accessScope',
  'llmToolName',
] as const satisfies ReadonlyArray<keyof InternalToolDefinition>;

const filterToolsByAgentType = ({
  agentType,
}: {
  agentType: 'personal' | 'system';
}): InternalToolDefinition[] =>
  getAllInternalTools().filter((tool) => isToolEligibleForAgentType(tool, agentType));

describe('internal tool registry', () => {
  it('should contain agent-use, agent-list, task-update, and user-ask with v1 metadata', () => {
    const tools = getAllInternalTools();

    expect(tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'agent-use',
          displayName: 'agent - use',
          description: 'Delegate to another agent by name',
          accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
          llmToolName: 'use_agent',
        }),
        expect.objectContaining({
          id: 'agent-list',
          displayName: 'agent - list',
          description:
            'List agents visible to caller. Optionally filter by specializationIds to return agents linked to those specializations.',
          accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
          llmToolName: 'list_agents',
        }),
        expect.objectContaining({
          id: 'task-update',
          displayName: 'task - update',
          description:
            'Persist title, category, specializationIds, or skillIdsUsed for the current task. taskId is optional during task execution — it is taken from execution context.',
          accessScope: InternalToolAccessScope.SYSTEM_ONLY,
          llmToolName: 'update_task',
        }),
        expect.objectContaining({
          id: 'user-ask',
          displayName: 'user - ask',
          description:
            'Ask the task creator one or more questions. Execution pauses until all pending questions are answered.',
          accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
          llmToolName: 'ask_user',
        }),
        expect.objectContaining({
          id: 'specialization-classify',
          displayName: 'specialization - classify',
          description:
            'Classify a task description into 1–3 specialization domains. Returns existing IDs or a signal to create a new specialization.',
          accessScope: InternalToolAccessScope.SYSTEM_ONLY,
          llmToolName: 'classify_specialization',
        }),
        expect.objectContaining({
          id: 'specialization-create',
          displayName: 'specialization - create',
          description:
            'Provision a new specialization domain: creates the entity, provisions researcher/worker/validator agents, and maps relevant MCPs.',
          accessScope: InternalToolAccessScope.SYSTEM_ONLY,
          llmToolName: 'create_specialization',
        }),
        expect.objectContaining({
          id: 'skill-create',
          displayName: 'skill - create',
          description:
            'Create a skill for a specialization with name, description, rule, and optional scripts.',
          accessScope: InternalToolAccessScope.SYSTEM_ONLY,
          llmToolName: 'create_skill',
        }),
        expect.objectContaining({
          id: 'skill-resolve',
          displayName: 'skill - resolve',
          description:
            'Resolve the full rule text for a named skill in a specialization domain.',
          accessScope: InternalToolAccessScope.SYSTEM_ONLY,
          llmToolName: 'resolve_skill',
        }),
        expect.objectContaining({
          id: 'skill-run-script',
          displayName: 'skill - run-script',
          description:
            'Execute a bundled script for a named skill in an isolated sandbox and return stdout, stderr, and exit code.',
          accessScope: InternalToolAccessScope.SYSTEM_ONLY,
          llmToolName: 'run_skill_script',
        }),
        expect.objectContaining({
          id: 'skill-plan',
          displayName: 'skill - plan',
          description:
            'Invoke the Skill planner to create a new skill when no existing skill fits the goal',
          accessScope: InternalToolAccessScope.SYSTEM_ONLY,
          llmToolName: 'invoke_skill_planner',
        }),
        expect.objectContaining({
          id: 'web-search',
          displayName: 'web - search',
          description: 'Search the web and return a list of results (title, URL, and snippet)',
          accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
          llmToolName: 'web_search',
        }),
        expect.objectContaining({
          id: 'web-page-content',
          displayName: 'web - page-content',
          description:
            'Fetch a web page and return its main text content, plus links to any images and videos found',
          accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
          llmToolName: 'web_page_content',
        }),
      ]),
    );
    expect(tools).toHaveLength(12);
  });

  it('should have unique registry ids', () => {
    const tools = getAllInternalTools();
    const ids = tools.map((tool) => tool.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should include required fields on every registry entry', () => {
    const tools = getAllInternalTools();

    expect(tools.length).toBeGreaterThan(0);

    for (const tool of tools) {
      for (const fieldKey of REQUIRED_FIELD_KEYS) {
        expect(tool[fieldKey], `tool "${tool.id}" missing ${fieldKey}`).toBeTruthy();
      }
    }
  });
});

describe('getInternalToolById', () => {
  it('should return the matching entry when id exists', () => {
    const useAgent = getInternalToolById('agent-use');
    const listAgents = getInternalToolById('agent-list');
    const updateTask = getInternalToolById('task-update');

    expect(useAgent).toEqual(
      expect.objectContaining({
        id: 'agent-use',
        displayName: 'agent - use',
        accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
      }),
    );
    expect(listAgents).toEqual(
      expect.objectContaining({
        id: 'agent-list',
        displayName: 'agent - list',
        accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
      }),
    );
    expect(updateTask).toEqual(
      expect.objectContaining({
        id: 'task-update',
        displayName: 'task - update',
        accessScope: InternalToolAccessScope.SYSTEM_ONLY,
        llmToolName: 'update_task',
      }),
    );
  });

  it('should return undefined when id is unknown', () => {
    expect(getInternalToolById('unknown-tool')).toBeUndefined();
  });
});

describe('isToolEligibleForAgentType', () => {
  it('should allow SYSTEM_AND_PERSONAL tools for personal agents', () => {
    const tool: InternalToolDefinition = {
      id: 'shared-tool',
      displayName: 'shared - tool',
      description: 'Available to personal and system agents',
      accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
      llmToolName: 'shared_tool',
    };

    expect(isToolEligibleForAgentType(tool, 'personal')).toBe(true);
  });

  it('should allow SYSTEM_AND_PERSONAL tools for system agents', () => {
    const tool: InternalToolDefinition = {
      id: 'shared-tool',
      displayName: 'shared - tool',
      description: 'Available to personal and system agents',
      accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
      llmToolName: 'shared_tool',
    };

    expect(isToolEligibleForAgentType(tool, 'system')).toBe(true);
  });

  it('should reject SYSTEM_ONLY tools for personal agents', () => {
    const tool: InternalToolDefinition = {
      id: 'system-only-tool',
      displayName: 'system - only',
      description: 'Available to system agents only',
      accessScope: InternalToolAccessScope.SYSTEM_ONLY,
      llmToolName: 'system_only_tool',
    };

    expect(isToolEligibleForAgentType(tool, 'personal')).toBe(false);
  });

  it('should allow SYSTEM_ONLY tools for system agents', () => {
    const tool: InternalToolDefinition = {
      id: 'system-only-tool',
      displayName: 'system - only',
      description: 'Available to system agents only',
      accessScope: InternalToolAccessScope.SYSTEM_ONLY,
      llmToolName: 'system_only_tool',
    };

    expect(isToolEligibleForAgentType(tool, 'system')).toBe(true);
  });
});

describe('filtering tools by agent type', () => {
  it('should return all v1 tools for personal agents', () => {
    const eligibleTools = filterToolsByAgentType({ agentType: 'personal' });

    expect(eligibleTools.map((tool) => tool.id).sort()).toEqual([
      'agent-list',
      'agent-use',
      'user-ask',
      'web-page-content',
      'web-search',
    ]);
  });

  it('should return all v1 tools for system agents', () => {
    const eligibleTools = filterToolsByAgentType({ agentType: 'system' });

    expect(eligibleTools.map((tool) => tool.id).sort()).toEqual([
      'agent-list',
      'agent-use',
      'skill-create',
      'skill-plan',
      'skill-resolve',
      'skill-run-script',
      'specialization-classify',
      'specialization-create',
      'task-update',
      'user-ask',
      'web-page-content',
      'web-search',
    ]);
  });
});
