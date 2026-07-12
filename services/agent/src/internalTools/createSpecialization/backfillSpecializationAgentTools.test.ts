import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAdminList, mockUpdateSystemAgent } = vi.hoisted(() => ({
  mockGetAdminList: vi.fn(),
  mockUpdateSystemAgent: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    commands: {
      update: mockUpdateSystemAgent,
    },
    queries: {
      getAdminList: mockGetAdminList,
    },
  },
}));

import { backfillSpecializationAgentTools } from './backfillSpecializationAgentTools';
import { SPECIALIZATION_AGENT_TOOL_IDS } from './constants';

describe('backfillSpecializationAgentTools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSystemAgent.mockResolvedValue({ data: { id: 'agent-1' } });
  });

  it('should update specialization agents missing web tool ids', async () => {
    mockGetAdminList.mockResolvedValue({
      items: [
        {
          id: 'agent-1',
          specializationId: 'spec-1',
          assignedToolIds: [],
        },
        {
          id: 'agent-2',
          specializationId: 'spec-1',
          assignedToolIds: ['web-search', 'web-page-content'],
        },
        {
          id: 'agent-3',
          specializationId: null,
          assignedToolIds: [],
        },
      ],
      totalCount: 3,
      page: 0,
      size: 100,
    });

    const result = await backfillSpecializationAgentTools();

    expect(result.updatedCount).toBe(2);
    expect(mockUpdateSystemAgent).toHaveBeenCalledTimes(2);
    expect(mockUpdateSystemAgent).toHaveBeenCalledWith({
      id: 'agent-1',
      updatedByAdminId: 'system-seed-admin',
      data: {
        assignedToolIds: [...SPECIALIZATION_AGENT_TOOL_IDS],
      },
    });
  });

  it('should return zero when all specialization agents already have tools', async () => {
    mockGetAdminList.mockResolvedValue({
      items: [
        {
          id: 'agent-1',
          specializationId: 'spec-1',
          assignedToolIds: [...SPECIALIZATION_AGENT_TOOL_IDS],
        },
      ],
      totalCount: 1,
      page: 0,
      size: 100,
    });

    const result = await backfillSpecializationAgentTools();

    expect(result.updatedCount).toBe(0);
    expect(mockUpdateSystemAgent).not.toHaveBeenCalled();
  });
});
