import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentCategory } from '@vassembly/domain-system-agent';
import { ValidationError } from '@vassembly/errors';

const {
  mockCreateSpecialization,
  mockGetBySpecializationId,
  mockCreateSystemAgent,
  mockGetPreferenceByUserId,
  mockMapMcpsToSpecialization,
  mockGenerateSpecializationAgentDescriptions,
  mockUpdateTask,
} = vi.hoisted(() => ({
  mockCreateSpecialization: vi.fn(),
  mockGetBySpecializationId: vi.fn(),
  mockCreateSystemAgent: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
  mockMapMcpsToSpecialization: vi.fn(),
  mockGenerateSpecializationAgentDescriptions: vi.fn(),
  mockUpdateTask: vi.fn(),
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    commands: {
      create: mockCreateSpecialization,
    },
  },
}));

vi.mock('@vassembly/domain-task', () => ({
  default: {
    commands: {
      updateTask: mockUpdateTask,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  AgentCategory: {
    Utility: 'utility',
  },
  default: {
    commands: {
      create: mockCreateSystemAgent,
    },
    queries: {
      getBySpecializationId: mockGetBySpecializationId,
      getPreferenceByUserId: mockGetPreferenceByUserId,
    },
  },
}));

vi.mock('./mapMcpsToSpecialization', () => ({
  mapMcpsToSpecialization: mockMapMcpsToSpecialization,
}));

vi.mock('./generateSpecializationAgentDescriptions', () => ({
  generateSpecializationAgentDescriptions: mockGenerateSpecializationAgentDescriptions,
}));

import { createSpecializationToolHandler } from './index';

import type { InternalToolContext } from '../types';
import { SPECIALIZATION_AGENT_TOOL_IDS } from './constants';

const TASK_ID = '507f1f77bcf86cd799439011';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: TASK_ID,
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

describe('createSpecialization internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateTask.mockResolvedValue({ data: { id: TASK_ID } });
    mockCreateSpecialization.mockResolvedValue({ id: 'spec-1', isNew: true });
    mockGetBySpecializationId.mockResolvedValue({ items: [] });
    mockCreateSystemAgent.mockResolvedValue({ data: { id: 'agent-1' } });
    mockGetPreferenceByUserId.mockResolvedValue({
      data: { integrationCredentialId: 'cred-1' },
    });
    mockMapMcpsToSpecialization.mockResolvedValue(undefined);
    mockGenerateSpecializationAgentDescriptions.mockResolvedValue(undefined);
  });

  it('should return existing specialization id when name already exists', async () => {
    mockCreateSpecialization.mockResolvedValue({ id: 'spec-existing', isNew: false });

    const result = await createSpecializationToolHandler(
      { name: 'legal', description: 'Legal specialization' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({ specializationId: 'spec-existing', isNew: false });
    expect(mockCreateSystemAgent).not.toHaveBeenCalled();
    expect(mockMapMcpsToSpecialization).not.toHaveBeenCalled();
  });

  it('should link specialization to task and update context when taskId is present', async () => {
    const context = { ...BASE_CONTEXT, specializationIds: null };

    await createSpecializationToolHandler(
      { name: 'legal', description: 'Legal specialization' },
      context,
    );

    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: TASK_ID,
      specializationIds: ['spec-1'],
    });
    expect(context.specializationIds).toEqual(['spec-1']);
  });

  it('should provision agents and fire MCP mapping for new specialization', async () => {
    const result = await createSpecializationToolHandler(
      { name: 'legal', description: 'Legal specialization' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({ specializationId: 'spec-1', isNew: true });
    expect(mockCreateSpecialization).toHaveBeenCalledWith({
      name: 'legal',
      description: 'Legal specialization',
    });
    expect(mockCreateSystemAgent).toHaveBeenCalledTimes(3);
    expect(mockCreateSystemAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Legal researcher',
        category: AgentCategory.Utility,
        specializationId: 'spec-1',
        assignedToolIds: [...SPECIALIZATION_AGENT_TOOL_IDS],
      }),
    );
    expect(mockMapMcpsToSpecialization).toHaveBeenCalledWith(
      expect.objectContaining({
        specializationId: 'spec-1',
        specializationName: 'legal',
        userId: 'user-1',
      }),
    );
    expect(mockMapMcpsToSpecialization).toHaveBeenCalledWith(
      expect.not.objectContaining({
        connectionOverride: expect.anything(),
      }),
    );
    expect(mockGenerateSpecializationAgentDescriptions).toHaveBeenCalledWith(
      expect.objectContaining({
        specializationId: 'spec-1',
        agentIds: ['agent-1', 'agent-1', 'agent-1'],
      }),
    );
  });

  it('should still return specializationId when agent provisioning partially fails', async () => {
    mockCreateSystemAgent
      .mockResolvedValueOnce({ data: { id: 'agent-1' } })
      .mockRejectedValueOnce(new Error('create failed'))
      .mockResolvedValueOnce({ data: { id: 'agent-3' } });

    const result = await createSpecializationToolHandler(
      { name: 'legal', description: 'Legal specialization' },
      BASE_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({ specializationId: 'spec-1', isNew: true });
    expect(mockCreateSystemAgent).toHaveBeenCalledTimes(3);
  });

  it('should not throw when MCP mapping rejects', async () => {
    mockMapMcpsToSpecialization.mockRejectedValue(new Error('mapping failed'));

    await expect(
      createSpecializationToolHandler(
        { name: 'legal', description: 'Legal specialization' },
        BASE_CONTEXT,
      ),
    ).resolves.toEqual(JSON.stringify({ specializationId: 'spec-1', isNew: true }));
  });

  it('should throw ValidationError when name is missing', async () => {
    await expect(
      createSpecializationToolHandler({ description: 'Legal specialization' }, BASE_CONTEXT),
    ).rejects.toThrow(ValidationError);
  });
});