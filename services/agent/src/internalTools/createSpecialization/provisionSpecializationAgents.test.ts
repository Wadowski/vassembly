import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentCategory } from '@vassembly/domain-system-agent';

const { mockGetBySpecializationId, mockCreateSystemAgent } = vi.hoisted(() => ({
  mockGetBySpecializationId: vi.fn(),
  mockCreateSystemAgent: vi.fn(),
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
    },
  },
}));

import { provisionSpecializationAgents } from './provisionSpecializationAgents';
import { SPECIALIZATION_AGENT_TOOL_IDS } from './constants';

describe('provisionSpecializationAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBySpecializationId.mockResolvedValue({ items: [] });
    mockCreateSystemAgent.mockResolvedValue({ data: { id: 'agent-1' } });
  });

  it('should assign web browser tools to newly provisioned specialization agents', async () => {
    await provisionSpecializationAgents({
      specializationId: 'spec-1',
      specializationName: 'legal',
    });

    expect(mockCreateSystemAgent).toHaveBeenCalledTimes(4);
    expect(mockCreateSystemAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        assignedToolIds: [...SPECIALIZATION_AGENT_TOOL_IDS],
      }),
    );
    expect(mockCreateSystemAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Legal methodologist',
        category: AgentCategory.Utility,
        specializationId: 'spec-1',
      }),
    );
  });
});