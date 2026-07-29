import { describe, expect, it } from 'vitest';

import {
  decorateMcpToolDescription,
  parseOriginalMcpToolName,
} from './mcpToolNameUtils';

describe('parseOriginalMcpToolName', () => {
  it('should strip the MCP server prefix from tool names', () => {
    expect(
      parseOriginalMcpToolName({
        toolName: 'mcp__6a687eda282888c80d162f8b__list_registries',
        serverName: '6a687eda282888c80d162f8b',
      }),
    ).toBe('list_registries');
  });

  it('should return the tool name unchanged when no prefix is present', () => {
    expect(
      parseOriginalMcpToolName({
        toolName: 'search',
        serverName: 'brave-1',
      }),
    ).toBe('search');
  });
});

describe('decorateMcpToolDescription', () => {
  it('should prefix the tool description with the MCP label', () => {
    const decorated = decorateMcpToolDescription({
      tool: { name: 'search', description: 'Search pages', invoke: async () => '' } as never,
      label: 'notion-mcp',
    });

    expect(decorated.description).toBe('[notion-mcp] Search pages');
    expect(decorated.name).toBe('search');
  });

  it('should use only the label when the tool has no description', () => {
    const decorated = decorateMcpToolDescription({
      tool: { name: 'search', invoke: async () => '' } as never,
      label: 'wikipedia-mcp',
    });

    expect(decorated.description).toBe('[wikipedia-mcp]');
  });
});
