import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';

const {
  mockGetById,
  mockGetActiveById,
  mockResolveAndBuildClient,
  mockResolveMcpSlugs,
  mockResolveMcpServerConfigs,
  mockInvoke,
  mockLoadAssignedInternalTools,
} = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockGetActiveById: vi.fn(),
  mockResolveAndBuildClient: vi.fn(),
  mockResolveMcpSlugs: vi.fn(),
  mockResolveMcpServerConfigs: vi.fn(),
  mockInvoke: vi.fn(),
  mockLoadAssignedInternalTools: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-agent')>();

  return {
    ...actual,
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

vi.mock('@vassembly/domain-system-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-system-agent')>();

  return {
    ...actual,
    default: {
      commands: {
        invoke: mockInvoke,
      },
      queries: {
        getActiveById: mockGetActiveById,
      },
    },
  };
});

vi.mock('@vassembly/domain-ai-integration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-ai-integration')>();

  return {
    ...actual,
    default: {
      commands: {
        resolveAndBuildClient: mockResolveAndBuildClient,
      },
      queries: actual.queries,
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

vi.mock('../resolveMcpSlugs', () => ({
  resolveMcpSlugs: mockResolveMcpSlugs,
}));

vi.mock('./loadAssignedInternalTools', () => ({
  loadAssignedInternalTools: mockLoadAssignedInternalTools,
}));

import { runAgentInvokeWithTools } from './runAgentInvokeWithTools';

import type { InternalToolContext } from './types';

const TOOL_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  callerAgentId: 'caller-agent-1',
  callerAgentType: 'personal',
  recursionDepth: 0,
  rootInvokeId: 'root-invoke-1',
};

const MODELED_CLIENT = {
  invoke: vi.fn(),
};

const INTEGRATION_SNAPSHOT = {
  integrationName: 'My OpenAI',
  provider: 'chatgpt',
  model: 'gpt-4o',
};

const RESOLVE_RESULT = {
  client: MODELED_CLIENT,
  integrationSnapshot: INTEGRATION_SNAPSHOT,
};

const INTERNAL_BINDINGS = [
  {
    toolId: 'list-agents',
    handler: vi.fn().mockResolvedValue('[]'),
  },
  {
    toolId: 'use-agent',
    handler: vi.fn().mockResolvedValue('delegated'),
  },
];

const MCP_SERVER_CONFIGS = [
  {
    serverName: 'mcp-1',
    transport: 'stdio' as const,
    command: 'npx',
    args: ['-y', '@example/mcp'],
  },
];

describe('runAgentInvokeWithTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        rule: 'You are helpful.',
        integrationCredentialId: 'cred-1',
        assignedMcpIds: ['mcp-1'],
        assignedToolIds: ['list-agents', 'use-agent'],
      },
    });
    mockResolveAndBuildClient.mockResolvedValue(RESOLVE_RESULT);
    mockResolveMcpSlugs.mockResolvedValue({ 'mcp-1': 'example-mcp' });
    mockResolveMcpServerConfigs.mockResolvedValue({
      serverConfigs: MCP_SERVER_CONFIGS,
      skippedMcpIds: [],
    });
    mockLoadAssignedInternalTools.mockResolvedValue({
      bindings: INTERNAL_BINDINGS,
      boundToolIds: ['list-agents', 'use-agent'],
      skippedToolIds: [],
    });
    mockInvoke.mockResolvedValue({
      message: 'Here is the answer.',
      usage: { promptTokens: 10, completionTokens: 20 },
      toolUsage: {
        internalToolIdsUsed: ['list-agents'],
        skippedInternalToolIds: [],
      },
    });
  });

  it('should report executed internal tools in metadata when personal agent has tools assigned', async () => {
    const result = await runAgentInvokeWithTools({
      userId: 'user-1',
      agentType: 'personal',
      agentId: 'agent-1',
      message: 'List agents and search the web',
      toolContext: TOOL_CONTEXT,
    });

    expect(result.message).toBe('Here is the answer.');
    expect(result.metadata.mcpIdsUsed).toEqual(['mcp-1']);
    expect(result.metadata.internalToolIdsUsed).toEqual(['list-agents']);
    expect(result.metadata.skippedMcpIds).toEqual([]);
    expect(result.metadata.skippedInternalToolIds).toEqual([]);
    expect(result.metadata.maxUseAgentDepth).toBe(2);
  });

  it('should record started and completed events when progress callback is provided', async () => {
    const recordProgress = vi.fn().mockResolvedValue(undefined);

    await runAgentInvokeWithTools({
      userId: 'user-1',
      agentType: 'personal',
      agentId: 'agent-1',
      message: 'Hello',
      toolContext: {
        ...TOOL_CONTEXT,
        recordAgentInvokeProgress: recordProgress,
      },
    });

    expect(recordProgress).toHaveBeenCalledTimes(2);
    expect(recordProgress).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        agentId: 'agent-1',
        state: 'started',
        inputMessages: 'Hello',
        integrationName: 'My OpenAI',
        provider: 'chatgpt',
        model: 'gpt-4o',
      }),
    );
    expect(recordProgress).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        agentId: 'agent-1',
        state: 'completed',
        tokenUsage: { input: 10, output: 20, total: 30 },
        integrationName: 'My OpenAI',
        provider: 'chatgpt',
        model: 'gpt-4o',
      }),
    );
  });

  it('should throw when personal agent has no integration credential', async () => {
    mockGetById.mockResolvedValue({
      data: {
        id: 'agent-1',
        userId: 'user-1',
        rule: 'You are helpful.',
        integrationCredentialId: undefined,
        assignedMcpIds: [],
        assignedToolIds: [],
      },
    });

    await expect(
      runAgentInvokeWithTools({
        userId: 'user-1',
        agentType: 'personal',
        agentId: 'agent-1',
        message: 'Hello',
        toolContext: TOOL_CONTEXT,
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should not record progress when resolveAndBuildClient rejects', async () => {
    const recordProgress = vi.fn().mockResolvedValue(undefined);
    mockResolveAndBuildClient.mockRejectedValue(new Error('Credential not found'));

    await expect(
      runAgentInvokeWithTools({
        userId: 'user-1',
        agentType: 'personal',
        agentId: 'agent-1',
        message: 'Hello',
        toolContext: {
          ...TOOL_CONTEXT,
          recordAgentInvokeProgress: recordProgress,
        },
      }),
    ).rejects.toThrow('Credential not found');

    expect(recordProgress).not.toHaveBeenCalled();
  });

  it('should include integration snapshot fields in failed progress event when invoke rejects', async () => {
    const recordProgress = vi.fn().mockResolvedValue(undefined);
    mockInvoke.mockRejectedValue(new Error('Provider invoke failed'));

    await expect(
      runAgentInvokeWithTools({
        userId: 'user-1',
        agentType: 'personal',
        agentId: 'agent-1',
        message: 'Hello',
        toolContext: {
          ...TOOL_CONTEXT,
          recordAgentInvokeProgress: recordProgress,
        },
      }),
    ).rejects.toThrow('Provider invoke failed');

    expect(recordProgress).toHaveBeenCalledTimes(2);
    expect(recordProgress).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        state: 'started',
        integrationName: 'My OpenAI',
        provider: 'chatgpt',
        model: 'gpt-4o',
      }),
    );
    expect(recordProgress).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        state: 'failed',
        integrationName: 'My OpenAI',
        provider: 'chatgpt',
        model: 'gpt-4o',
        errorDetails: expect.objectContaining({
          message: 'Provider invoke failed',
        }),
      }),
    );
  });
});
