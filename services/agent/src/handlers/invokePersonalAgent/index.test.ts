import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';

const {
  mockGetById,
  mockResolveAndBuildClient,
  mockResolveMcpServerConfigs,
  mockInvoke,
  mockResolveMcpSlugs,
} = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockResolveAndBuildClient: vi.fn(),
  mockResolveMcpServerConfigs: vi.fn(),
  mockInvoke: vi.fn(),
  mockResolveMcpSlugs: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', async () => {
  const domain = await import('../../../../../domains/agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {
        invoke: mockInvoke,
      },
      queries: {
        getById: mockGetById,
      },
    },
  };
});

vi.mock('@vassembly/domain-ai-integration', async () => {
  const domain = await import('../../../../../domains/ai-integration/src/index.js');

  return {
    ...domain,
    default: {
      commands: {
        resolveAndBuildClient: mockResolveAndBuildClient,
      },
      queries: domain.queries,
    },
  };
});

vi.mock('@vassembly/domain-user-mcp-config', () => ({
  default: {
    commands: {
      resolveMcpServerConfigs: mockResolveMcpServerConfigs,
    },
  },
}));

vi.mock('../../helpers/resolveMcpSlugs', () => ({
  resolveMcpSlugs: mockResolveMcpSlugs,
}));

import { invokePersonalAgent } from './index';

const MODELED_CLIENT = {
  invoke: vi.fn(),
};

const RESOLVE_RESULT = {
  client: MODELED_CLIENT,
  integrationSnapshot: {
    integrationName: 'My OpenAI',
    provider: 'chatgpt',
    model: 'gpt-4o',
  },
};

describe('invokePersonalAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        rule: 'You are a research assistant.',
        integrationCredentialId: 'cred-1',
        assignedMcpIds: ['mcp-1'],
      },
    });
    mockResolveAndBuildClient.mockResolvedValue(RESOLVE_RESULT);
    mockResolveMcpSlugs.mockResolvedValue({ 'mcp-1': 'brave-search-mcp' });
    mockResolveMcpServerConfigs.mockResolvedValue({
      serverConfigs: [
        {
          serverName: 'mcp-1',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', '@brave/brave-search-mcp-server'],
        },
      ],
      skippedMcpIds: [],
    });
    mockInvoke.mockResolvedValue({ message: 'Here are the results.' });
  });

  it('should resolve MCP configs and invoke the agent', async () => {
    const result = await invokePersonalAgent({
      userId: 'user-1',
      agentId: 'agent-1',
      message: 'Find recent news',
    });

    expect(result.message).toBe('Here are the results.');
    expect(result.metadata?.mcpIdsUsed).toEqual(['mcp-1']);
    expect(mockInvoke).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Find recent news',
        systemMessage: 'You are a research assistant.',
        mcpServerConfigs: [
          expect.objectContaining({
            serverName: 'mcp-1',
            transport: 'stdio',
          }),
        ],
      }),
    );
  });

  it('should throw when agent has no integration credential', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        integrationCredentialId: undefined,
        assignedMcpIds: [],
      },
    });

    await expect(
      invokePersonalAgent({
        userId: 'user-1',
        agentId: 'agent-1',
        message: 'Hello',
      }),
    ).rejects.toThrow(WrongParamError);
  });
});
