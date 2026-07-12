import { MAX_USE_AGENT_DEPTH } from '@vassembly/constants';

import { WrongParamError, UserInputWaitingError } from '@vassembly/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetById,
  mockGetActiveById,
  mockResolveAndBuildClient,
  mockResolvePlatformClient,
  mockResolveMcpSlugs,
  mockResolveMcpServerConfigs,
  mockInvoke,
  mockLoadAssignedInternalTools,
  mockGetCatalogBySpecializationId,
  mockSpecializationGetById,
} = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockGetActiveById: vi.fn(),
  mockResolveAndBuildClient: vi.fn(),
  mockResolvePlatformClient: vi.fn(),
  mockResolveMcpSlugs: vi.fn(),
  mockResolveMcpServerConfigs: vi.fn(),
  mockInvoke: vi.fn(),
  mockLoadAssignedInternalTools: vi.fn(),
  mockGetCatalogBySpecializationId: vi.fn(),
  mockSpecializationGetById: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', () => ({
  default: {
    commands: {
      invoke: mockInvoke,
    },
    queries: {
      getById: mockGetById,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    commands: {
      invoke: mockInvoke,
    },
    queries: {
      getActiveById: mockGetActiveById,
    },
  },
  SYSTEM_AGENT_ERROR_CODES: {
    NOT_FOUND: 'SYSTEM_AGENT_NOT_FOUND',
  },
}));

vi.mock('@vassembly/domain-ai-integration', () => ({
  default: {
    commands: {
      resolveAndBuildClient: mockResolveAndBuildClient,
      resolvePlatformClient: mockResolvePlatformClient,
    },
  },
}));

vi.mock('@vassembly/domain-user-mcp-config', () => ({
  default: {
    commands: {
      resolveMcpServerConfigs: mockResolveMcpServerConfigs,
    },
  },
}));

vi.mock('../helpers/resolveMcpSlugs', () => ({
  resolveMcpSlugs: mockResolveMcpSlugs,
}));

vi.mock('./loadAssignedInternalTools', () => ({
  loadAssignedInternalTools: mockLoadAssignedInternalTools,
}));

vi.mock('@vassembly/domain-skill', () => ({
  formatSkillsCatalogSection: ({ items }: { items: Array<{ name: string; description: string }> }) =>
    items.length === 0 ? '' : `## Available Skills\n\n- **${items[0]?.name}**: ${items[0]?.description}`,
  default: {
    queries: {
      getCatalogBySpecializationId: mockGetCatalogBySpecializationId,
    },
  },
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    queries: {
      getById: mockSpecializationGetById,
    },
  },
}));

import { runAgentInvokeWithTools } from './runAgentInvokeWithTools';

import type { InternalToolContext } from './types';

const TOOL_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  invocationId: 'invocation-1',
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

const PLATFORM_INTEGRATION_SNAPSHOT = {
  integrationName: 'Platform AI',
  provider: 'gemini',
  model: 'gemini-2.0-flash',
};

const RESOLVE_RESULT = {
  client: MODELED_CLIENT,
  integrationSnapshot: INTEGRATION_SNAPSHOT,
};

const PLATFORM_RESOLVE_RESULT = {
  client: MODELED_CLIENT,
  integrationSnapshot: PLATFORM_INTEGRATION_SNAPSHOT,
};

const INTERNAL_BINDINGS = [
  {
    toolId: 'agent-list',
    handler: vi.fn().mockResolvedValue('[]'),
  },
  {
    toolId: 'agent-use',
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
        assignedToolIds: ['agent-list', 'agent-use'],
      },
    });
    mockResolveAndBuildClient.mockResolvedValue(RESOLVE_RESULT);
    mockResolvePlatformClient.mockResolvedValue(PLATFORM_RESOLVE_RESULT);
    mockResolveMcpSlugs.mockResolvedValue({ 'mcp-1': 'example-mcp' });
    mockResolveMcpServerConfigs.mockResolvedValue({
      serverConfigs: MCP_SERVER_CONFIGS,
      skippedMcpIds: [],
    });
    mockLoadAssignedInternalTools.mockResolvedValue({
      bindings: INTERNAL_BINDINGS,
      boundToolIds: ['agent-list', 'agent-use'],
      skippedToolIds: [],
    });
    mockGetCatalogBySpecializationId.mockResolvedValue({ items: [] });
    mockInvoke.mockResolvedValue({
      message: 'Here is the answer.',
      usage: { promptTokens: 10, completionTokens: 20 },
      toolUsage: {
        internalToolIdsUsed: ['agent-list'],
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
    expect(result.metadata.internalToolIdsUsed).toEqual(['agent-list']);
    expect(result.metadata.skippedMcpIds).toEqual([]);
    expect(result.metadata.skippedInternalToolIds).toEqual([]);
    expect(result.metadata.maxUseAgentDepth).toBe(MAX_USE_AGENT_DEPTH);
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

  it('should report MCP ids used when mcpIdsOverride is provided for system agent', async () => {
    mockGetActiveById.mockResolvedValue({
      data: {
        id: 'system-agent-1',
        name: 'Skill planner',
        rule: 'Create skills.',
        assignedToolIds: ['skill-create'],
      },
    });
    mockLoadAssignedInternalTools.mockResolvedValue({
      bindings: [],
      boundToolIds: [],
      skippedToolIds: [],
    });

    const result = await runAgentInvokeWithTools({
      userId: 'user-1',
      agentType: 'system',
      agentId: 'system-agent-1',
      message: 'Create skill',
      credentialScope: 'platform',
      mcpIdsOverride: ['mcp-1'],
      toolContext: TOOL_CONTEXT,
    });

    expect(result.metadata.mcpIdsUsed).toEqual(['mcp-1']);
    expect(result.metadata.skippedMcpIds).toEqual([]);
  });

  it('should not inject skill catalog for Task planner agents', async () => {
    mockGetActiveById.mockResolvedValue({
      data: {
        id: 'task-planner-1',
        name: 'Task planner',
        rule: 'Plan tasks.',
        assignedToolIds: [],
      },
    });
    mockLoadAssignedInternalTools.mockResolvedValue({
      bindings: [],
      boundToolIds: [],
      skippedToolIds: [],
    });

    await runAgentInvokeWithTools({
      userId: 'user-1',
      agentType: 'system',
      agentId: 'task-planner-1',
      message: 'Plan review',
      toolContext: {
        ...TOOL_CONTEXT,
        specializationIds: ['spec-legal'],
      },
    });

    expect(mockSpecializationGetById).not.toHaveBeenCalled();
    expect(mockGetCatalogBySpecializationId).not.toHaveBeenCalled();
    expect(mockInvoke).toHaveBeenCalledWith(
      expect.objectContaining({
        skillsCatalogSection: undefined,
      }),
    );
  });

  it('should inject skills catalog section for specialization-scoped system agents', async () => {
    mockGetActiveById.mockResolvedValue({
      data: {
        id: 'system-agent-1',
        name: 'Legal worker',
        rule: 'Plan legal work.',
        specializationId: 'spec-legal',
        assignedToolIds: [],
      },
    });
    mockGetCatalogBySpecializationId.mockResolvedValue({
      items: [{ name: 'contract-review', description: 'Review contracts' }],
    });
    mockLoadAssignedInternalTools.mockResolvedValue({
      bindings: [],
      boundToolIds: [],
      skippedToolIds: [],
    });

    await runAgentInvokeWithTools({
      userId: 'user-1',
      agentType: 'system',
      agentId: 'system-agent-1',
      message: 'Plan review',
      toolContext: TOOL_CONTEXT,
    });

    expect(mockGetCatalogBySpecializationId).toHaveBeenCalledWith({
      specializationId: 'spec-legal',
    });
    expect(mockInvoke).toHaveBeenCalledWith(
      expect.objectContaining({
        skillsCatalogSection: '## Available Skills\n\n- **contract-review**: Review contracts',
      }),
    );
  });

  it('should inject empty skills catalog marker when specialization has no skills', async () => {
    mockGetActiveById.mockResolvedValue({
      data: {
        id: 'system-agent-1',
        name: 'Legal researcher',
        rule: 'Research legal topics.',
        specializationId: 'spec-legal',
        assignedToolIds: [],
      },
    });
    mockGetCatalogBySpecializationId.mockResolvedValue({ items: [] });
    mockLoadAssignedInternalTools.mockResolvedValue({
      bindings: [],
      boundToolIds: [],
      skippedToolIds: [],
    });

    await runAgentInvokeWithTools({
      userId: 'user-1',
      agentType: 'system',
      agentId: 'system-agent-1',
      message: 'Research topic',
      toolContext: TOOL_CONTEXT,
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      expect.objectContaining({
        skillsCatalogSection: '## Available Skills\n\n(none)',
      }),
    );
  });

  it('should record waiting progress event when invoke throws UserInputWaitingError', async () => {
    const recordProgress = vi.fn().mockResolvedValue(undefined);
    mockInvoke.mockRejectedValue(new UserInputWaitingError());

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
    ).rejects.toThrow(UserInputWaitingError);

    expect(recordProgress).toHaveBeenCalledTimes(2);
    expect(recordProgress).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        state: 'started',
      }),
    );
    expect(recordProgress).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        state: 'waiting',
        integrationName: 'My OpenAI',
        provider: 'chatgpt',
        model: 'gpt-4o',
      }),
    );
  });

  describe('credential routing', () => {
    beforeEach(() => {
      mockGetActiveById.mockResolvedValue({
        data: {
          id: 'system-agent-1',
          name: 'Task title generator',
          rule: 'Generate a title.',
          assignedToolIds: [],
        },
      });
      mockLoadAssignedInternalTools.mockResolvedValue({
        bindings: [],
        boundToolIds: [],
        skippedToolIds: [],
      });
    });

    it('should not record progress when credentialScope is platform', async () => {
      mockResolveAndBuildClient.mockRejectedValue(new Error('user credential path must not run'));

      const recordProgress = vi.fn().mockResolvedValue(undefined);

      await runAgentInvokeWithTools({
        userId: 'user-1',
        agentType: 'system',
        agentId: 'system-agent-1',
        message: 'Generate a title',
        credentialScope: 'platform',
        toolContext: {
          ...TOOL_CONTEXT,
          recordAgentInvokeProgress: recordProgress,
        },
      });

      expect(recordProgress).not.toHaveBeenCalled();
    });

    it('should use user integration snapshot when credentialScope is omitted', async () => {
      mockResolvePlatformClient.mockRejectedValue(new Error('platform credential path must not run'));

      const recordProgress = vi.fn().mockResolvedValue(undefined);

      await runAgentInvokeWithTools({
        userId: 'user-1',
        agentType: 'system',
        agentId: 'system-agent-1',
        message: 'Hello',
        toolContext: {
          ...TOOL_CONTEXT,
          recordAgentInvokeProgress: recordProgress,
        },
      });

      expect(recordProgress).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          integrationName: 'My OpenAI',
          provider: 'chatgpt',
          model: 'gpt-4o',
        }),
      );
    });

    it('should use user integration snapshot when credentialScope is user', async () => {
      mockResolvePlatformClient.mockRejectedValue(new Error('platform credential path must not run'));

      const recordProgress = vi.fn().mockResolvedValue(undefined);

      await runAgentInvokeWithTools({
        userId: 'user-1',
        agentType: 'system',
        agentId: 'system-agent-1',
        message: 'Hello',
        credentialScope: 'user',
        toolContext: {
          ...TOOL_CONTEXT,
          recordAgentInvokeProgress: recordProgress,
        },
      });

      expect(recordProgress).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          integrationName: 'My OpenAI',
          provider: 'chatgpt',
          model: 'gpt-4o',
        }),
      );
    });

    it('should ignore connectionOverride when credentialScope is platform', async () => {
      mockResolveAndBuildClient.mockRejectedValue(new Error('user credential path must not run'));

      const recordProgress = vi.fn().mockResolvedValue(undefined);

      await runAgentInvokeWithTools({
        userId: 'user-1',
        agentType: 'system',
        agentId: 'system-agent-1',
        message: 'Generate a title',
        credentialScope: 'platform',
        connectionOverride: { integrationCredentialId: 'user-cred-override' },
        toolContext: {
          ...TOOL_CONTEXT,
          recordAgentInvokeProgress: recordProgress,
        },
      });

      expect(mockResolvePlatformClient).toHaveBeenCalled();
      expect(recordProgress).not.toHaveBeenCalled();
    });
  });
});
