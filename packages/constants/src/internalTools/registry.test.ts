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
  it('should contain use-agent, list-agents, and update-task with v1 metadata', () => {
    const tools = getAllInternalTools();

    expect(tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'use-agent',
          displayName: 'Use agent',
          description: 'Delegate to another agent by name',
          accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
          llmToolName: 'use_agent',
        }),
        expect.objectContaining({
          id: 'list-agents',
          displayName: 'List agents',
          description: 'List agents visible to caller',
          accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
          llmToolName: 'list_agents',
        }),
        expect.objectContaining({
          id: 'update-task',
          displayName: 'Update task',
          description: 'Persist title and/or category for a task by its ID',
          accessScope: InternalToolAccessScope.SYSTEM_ONLY,
          llmToolName: 'update_task',
        }),
      ]),
    );
    expect(tools).toHaveLength(3);
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
    const useAgent = getInternalToolById('use-agent');
    const listAgents = getInternalToolById('list-agents');
    const updateTask = getInternalToolById('update-task');

    expect(useAgent).toEqual(
      expect.objectContaining({
        id: 'use-agent',
        displayName: 'Use agent',
        accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
      }),
    );
    expect(listAgents).toEqual(
      expect.objectContaining({
        id: 'list-agents',
        displayName: 'List agents',
        accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
      }),
    );
    expect(updateTask).toEqual(
      expect.objectContaining({
        id: 'update-task',
        displayName: 'Update task',
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
      displayName: 'Shared tool',
      description: 'Available to personal and system agents',
      accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
      llmToolName: 'shared_tool',
    };

    expect(isToolEligibleForAgentType(tool, 'personal')).toBe(true);
  });

  it('should allow SYSTEM_AND_PERSONAL tools for system agents', () => {
    const tool: InternalToolDefinition = {
      id: 'shared-tool',
      displayName: 'Shared tool',
      description: 'Available to personal and system agents',
      accessScope: InternalToolAccessScope.SYSTEM_AND_PERSONAL,
      llmToolName: 'shared_tool',
    };

    expect(isToolEligibleForAgentType(tool, 'system')).toBe(true);
  });

  it('should reject SYSTEM_ONLY tools for personal agents', () => {
    const tool: InternalToolDefinition = {
      id: 'system-only-tool',
      displayName: 'System only tool',
      description: 'Available to system agents only',
      accessScope: InternalToolAccessScope.SYSTEM_ONLY,
      llmToolName: 'system_only_tool',
    };

    expect(isToolEligibleForAgentType(tool, 'personal')).toBe(false);
  });

  it('should allow SYSTEM_ONLY tools for system agents', () => {
    const tool: InternalToolDefinition = {
      id: 'system-only-tool',
      displayName: 'System only tool',
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

    expect(eligibleTools.map((tool) => tool.id).sort()).toEqual(['list-agents', 'use-agent']);
  });

  it('should return all v1 tools for system agents', () => {
    const eligibleTools = filterToolsByAgentType({ agentType: 'system' });

    expect(eligibleTools.map((tool) => tool.id).sort()).toEqual([
      'list-agents',
      'update-task',
      'use-agent',
    ]);
  });
});
