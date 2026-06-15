import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AgentCategory, AgentStatus } from '@vassembly/domain-agent';
import { NotFoundError } from '@vassembly/errors';

const {
  mockGetActiveByName,
  mockGetListForUser,
  mockGetPreferenceByUserId,
  mockRunAgentInvokeWithTools,
} = vi.hoisted(() => ({
  mockGetActiveByName: vi.fn(),
  mockGetListForUser: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockRunAgentInvokeWithTools: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-system-agent')>();

  return {
    ...actual,
    default: {
      commands: actual.default.commands,
      queries: {
        ...actual.default.queries,
        getActiveByName: mockGetActiveByName,
        getPreferenceByUserId: mockGetPreferenceByUserId,
      },
    },
  };
});

vi.mock('@vassembly/domain-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-agent')>();

  return {
    ...actual,
    default: {
      commands: actual.default.commands,
      queries: {
        ...actual.default.queries,
        getListForUser: mockGetListForUser,
      },
    },
  };
});

vi.mock('../runAgentInvokeWithTools', () => ({
  runAgentInvokeWithTools: mockRunAgentInvokeWithTools,
}));

import { useAgent } from './index';

import type { InternalToolContext } from '../types';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  callerAgentId: 'caller-agent-1',
  callerAgentType: 'personal',
  recursionDepth: 0,
  rootInvokeId: 'root-invoke-1',
};

const PERSONAL_TARGET = {
  id: 'personal-target-1',
  userId: 'user-1',
  name: 'Research Bot',
  description: 'Research',
  category: AgentCategory.Personal,
  status: AgentStatus.Active,
  integrationCredentialId: 'cred-personal',
  assignedToolIds: ['list-agents'],
  assignedMcpIds: ['mcp-1'],
};

const SYSTEM_TARGET = {
  id: 'system-target-1',
  name: 'Research Bot',
  description: 'System research',
  status: AgentStatus.Active,
  rule: 'You research.',
  assignedToolIds: ['use-agent'],
  assignedMcpIds: [],
};

describe('useAgent internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveByName.mockRejectedValue(new NotFoundError('System agent not found'));
    mockGetListForUser.mockResolvedValue({
      items: [PERSONAL_TARGET],
      totalCount: 1,
      page: 0,
      size: 50,
    });
    mockGetPreferenceByUserId.mockResolvedValue({
      data: { integrationCredentialId: 'cred-system' },
    });
    mockRunAgentInvokeWithTools.mockResolvedValue({
      message: 'Nested agent response',
      metadata: {
        mcpIdsUsed: ['mcp-1'],
        skippedMcpIds: [],
        internalToolIdsUsed: ['list-agents'],
        skippedInternalToolIds: [],
        maxUseAgentDepth: 2,
      },
    });
  });

  it('should return depth error when recursion depth blocks the third delegation', async () => {
    const result = await useAgent({
      args: { name: 'Research Bot', agentPrompt: 'Summarize findings' },
      context: { ...BASE_CONTEXT, recursionDepth: 2 },
    });

    expect(result).toBe('Maximum agent delegation depth reached.');
  });

  it('should return not allowed error when personal caller targets a system-only agent', async () => {
    mockGetListForUser.mockResolvedValue({
      items: [],
      totalCount: 0,
      page: 0,
      size: 50,
    });
    mockGetActiveByName.mockResolvedValue({
      data: SYSTEM_TARGET,
    });

    const result = await useAgent({
      args: { name: 'Research Bot', agentPrompt: 'Run compliance check' },
      context: { ...BASE_CONTEXT, callerAgentType: 'personal' },
    });

    expect(result).toBe('That agent cannot be invoked by this agent.');
  });

  it('should invoke system agent before personal agent when caller is system and names match', async () => {
    mockGetActiveByName.mockResolvedValue({
      data: SYSTEM_TARGET,
    });
    mockGetListForUser.mockResolvedValue({
      items: [PERSONAL_TARGET],
      totalCount: 1,
      page: 0,
      size: 50,
    });
    mockRunAgentInvokeWithTools.mockImplementation(
      async ({ agentType }: { agentType: 'personal' | 'system' }) => ({
        message: agentType === 'system' ? 'system-response' : 'personal-response',
        metadata: {
          mcpIdsUsed: [],
          skippedMcpIds: [],
          internalToolIdsUsed: [],
          skippedInternalToolIds: [],
          maxUseAgentDepth: 2,
        },
      }),
    );

    const result = await useAgent({
      args: { name: 'research bot', agentPrompt: 'Compare policies' },
      context: { ...BASE_CONTEXT, callerAgentType: 'system' },
    });

    expect(result).toBe('system-response');
  });

  it('should return ambiguity error when multiple personal agents match the name', async () => {
    mockGetListForUser.mockResolvedValue({
      items: [
        PERSONAL_TARGET,
        {
          ...PERSONAL_TARGET,
          id: 'personal-target-2',
        },
      ],
      totalCount: 2,
      page: 0,
      size: 50,
    });

    const result = await useAgent({
      args: { name: 'Research Bot', agentPrompt: 'Do work' },
      context: { ...BASE_CONTEXT, callerAgentType: 'personal' },
    });

    expect(result).toBe('Multiple agents match this name. Rename agents to continue.');
  });

  it('should return credential error when personal target has no integration', async () => {
    mockGetListForUser.mockResolvedValue({
      items: [{ ...PERSONAL_TARGET, integrationCredentialId: undefined }],
      totalCount: 1,
      page: 0,
      size: 50,
    });

    const result = await useAgent({
      args: { name: 'Research Bot', agentPrompt: 'Analyze data' },
      context: { ...BASE_CONTEXT, callerAgentType: 'personal' },
    });

    expect(result).toBe('The selected agent does not have a connected AI integration.');
  });

  it('should return credential error when system target has no user preference', async () => {
    mockGetActiveByName.mockResolvedValue({
      data: SYSTEM_TARGET,
    });
    mockGetPreferenceByUserId.mockResolvedValue({
      data: null,
    });

    const result = await useAgent({
      args: { name: 'Research Bot', agentPrompt: 'Run task' },
      context: { ...BASE_CONTEXT, callerAgentType: 'system' },
    });

    expect(result).toBe('The selected agent does not have a connected AI integration.');
  });

  it('should return nested invoke message when personal target has a connected integration', async () => {
    const result = await useAgent({
      args: { name: 'Research Bot', agentPrompt: 'Draft summary' },
      context: { ...BASE_CONTEXT, callerAgentType: 'personal' },
    });

    expect(result).toBe('Nested agent response');
  });
});
