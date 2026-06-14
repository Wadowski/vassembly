import { describe, it, expect } from 'vitest';
import { DynamicStructuredTool } from '@langchain/core/tools';

import { buildInternalTools } from './buildInternalTools';

import type { InternalToolHandler } from './types';

const createHandlers = (
  overrides: Partial<Record<string, InternalToolHandler>> = {},
): Record<string, InternalToolHandler> => ({
  'use-agent': async () => 'use-agent-result',
  'list-agents': async () => 'list-agents-result',
  ...overrides,
});

describe('buildInternalTools', () => {
  it('should create DynamicStructuredTool instances for assigned registry ids', () => {
    const result = buildInternalTools({
      toolIds: ['use-agent', 'list-agents'],
      handlers: createHandlers(),
    });

    expect(result.tools).toHaveLength(2);
    expect(result.tools.every((tool) => tool instanceof DynamicStructuredTool)).toBe(true);
    expect(result.boundToolIds).toEqual(['use-agent', 'list-agents']);
    expect(result.skippedToolIds).toEqual([]);
  });

  it('should skip unknown tool ids', () => {
    const result = buildInternalTools({
      toolIds: ['use-agent', 'removed-tool', 'list-agents', 'not-in-registry'],
      handlers: createHandlers(),
    });

    expect(result.boundToolIds).toEqual(['use-agent', 'list-agents']);
    expect(result.skippedToolIds).toEqual(['removed-tool', 'not-in-registry']);
    expect(result.tools).toHaveLength(2);
  });

  it('should merge injected handlers so tool invocation returns handler output', async () => {
    const handlers = createHandlers({
      'use-agent': async () => 'delegated-response',
      'list-agents': async () => JSON.stringify([{ name: 'Support', agentType: 'personal' }]),
    });

    const result = buildInternalTools({
      toolIds: ['use-agent', 'list-agents'],
      handlers,
    });

    const useAgentTool = result.tools.find((tool) => tool.name === 'use_agent');
    const listAgentsTool = result.tools.find((tool) => tool.name === 'list_agents');

    expect(useAgentTool).toBeDefined();
    expect(listAgentsTool).toBeDefined();

    await expect(
      useAgentTool!.invoke({ name: 'Support', agentPrompt: 'Summarize open tickets' }),
    ).resolves.toBe('delegated-response');

    await expect(listAgentsTool!.invoke({})).resolves.toBe(
      JSON.stringify([{ name: 'Support', agentType: 'personal' }]),
    );
  });

  it('should name tools using llmToolName from the registry', () => {
    const result = buildInternalTools({
      toolIds: ['use-agent', 'list-agents'],
      handlers: createHandlers(),
    });

    const toolNames = result.tools.map((tool) => tool.name).sort();

    expect(toolNames).toEqual(['list_agents', 'use_agent']);
  });
});
