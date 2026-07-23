import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SYSTEM_AGENT_NAME } from '@vassembly/constants';
import { ValidationError } from '@vassembly/errors';

const {
  mockGetList,
  mockGetPreferenceByUserId,
  mockGetActiveByName,
  mockRunAgentInvokeWithTools,
} = vi.hoisted(() => ({
  mockGetList: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockGetActiveByName: vi.fn(),
  mockRunAgentInvokeWithTools: vi.fn(),
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    queries: {
      getList: mockGetList,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: {
      getPreferenceByUserId: mockGetPreferenceByUserId,
      getActiveByName: mockGetActiveByName,
    },
  },
}));

vi.mock('../runAgentInvokeWithTools', () => ({
  runAgentInvokeWithTools: mockRunAgentInvokeWithTools,
}));

import { classifySpecializationToolHandler } from './index';

import type { InternalToolContext } from '../types';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  commentId: 'comment-1',
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

describe('classifySpecialization internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetList.mockResolvedValue({
      items: [{ id: 'spec-legal', name: 'legal', description: 'Legal work' }],
      total: 1,
      page: 0,
      size: 500,
    });
    mockGetPreferenceByUserId.mockResolvedValue({
      data: { integrationCredentialId: 'cred-1' },
    });
    mockGetActiveByName.mockResolvedValue({
      data: { id: 'classifier-agent-1' },
    });
    mockRunAgentInvokeWithTools.mockResolvedValue({
      message: 'legal',
      metadata: { mcpIdsUsed: [], skippedMcpIds: [], internalToolIdsUsed: [], skippedInternalToolIds: [], maxUseAgentDepth: 3 },
    });
  });

  it('should return skipped JSON when description is too short', async () => {
    const result = await classifySpecializationToolHandler(
      { taskId: 'task-1', description: 'short' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({ type: 'skipped', reason: 'short_description' });
    expect(mockRunAgentInvokeWithTools).not.toHaveBeenCalled();
  });

  it('should classify without user credential using platform scope', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });

    const result = await classifySpecializationToolHandler(
      { taskId: 'task-1', description: 'Review employment contract terms' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({
      type: 'existing',
      specializationIds: ['spec-legal'],
    });
    expect(mockRunAgentInvokeWithTools).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialScope: 'platform',
      }),
    );
  });

  it('should return existing specialization IDs when classifier matches catalog', async () => {
    const result = await classifySpecializationToolHandler(
      { taskId: 'task-1', description: 'Review employment contract terms' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({
      type: 'existing',
      specializationIds: ['spec-legal'],
    });
    expect(mockGetActiveByName).toHaveBeenCalledWith({
      name: SYSTEM_AGENT_NAME.SpecializationClassifier,
    });
    expect(mockRunAgentInvokeWithTools).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'classifier-agent-1',
        credentialScope: 'platform',
      }),
    );
  });

  it('should return new specialization signal when classifier returns NEW line', async () => {
    mockRunAgentInvokeWithTools.mockResolvedValue({
      message: 'NEW: compliance|Handles compliance reviews',
      metadata: { mcpIdsUsed: [], skippedMcpIds: [], internalToolIdsUsed: [], skippedInternalToolIds: [], maxUseAgentDepth: 3 },
    });

    const result = await classifySpecializationToolHandler(
      { taskId: 'task-1', description: 'Review employment contract terms' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({
      type: 'new',
      name: 'compliance',
      description: 'Handles compliance reviews',
    });
  });

  it('should return skipped JSON when classifier output is malformed', async () => {
    mockRunAgentInvokeWithTools.mockResolvedValue({
      message: 'unknown-domain',
      metadata: { mcpIdsUsed: [], skippedMcpIds: [], internalToolIdsUsed: [], skippedInternalToolIds: [], maxUseAgentDepth: 3 },
    });

    const result = await classifySpecializationToolHandler(
      { taskId: 'task-1', description: 'Review employment contract terms' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({ type: 'skipped', reason: 'invalid_output' });
  });

  it('should throw ValidationError when description is missing', async () => {
    await expect(classifySpecializationToolHandler({ taskId: 'task-1' }, BASE_CONTEXT)).rejects.toThrow(
      ValidationError,
    );
  });
});
