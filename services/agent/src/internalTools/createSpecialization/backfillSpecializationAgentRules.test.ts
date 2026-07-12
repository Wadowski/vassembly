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

import { backfillSpecializationAgentRules } from './backfillSpecializationAgentRules';
import { SPECIALIZATION_AGENT_RULES } from './constants';

describe('backfillSpecializationAgentRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSystemAgent.mockResolvedValue({ data: { id: 'agent-1' } });
  });

  it('should update specialization agents with outdated rule text', async () => {
    mockGetAdminList.mockResolvedValue({
      items: [
        {
          id: 'agent-1',
          name: 'Legal researcher',
          specializationId: 'spec-1',
          rule: 'Old researcher rule',
        },
        {
          id: 'agent-2',
          name: 'Legal worker',
          specializationId: 'spec-1',
          rule: SPECIALIZATION_AGENT_RULES.worker,
        },
        {
          id: 'agent-3',
          name: 'Task worker',
          specializationId: 'spec-1',
          rule: 'Old rule',
        },
      ],
      totalCount: 3,
      page: 0,
      size: 100,
    });

    const result = await backfillSpecializationAgentRules();

    expect(result.updatedCount).toBe(1);
    expect(mockUpdateSystemAgent).toHaveBeenCalledTimes(1);
    expect(mockUpdateSystemAgent).toHaveBeenCalledWith({
      id: 'agent-1',
      updatedByAdminId: 'system-seed-admin',
      data: {
        rule: SPECIALIZATION_AGENT_RULES.researcher,
      },
    });
  });

  it('should return zero when all specialization agents already have current rules', async () => {
    mockGetAdminList.mockResolvedValue({
      items: [
        {
          id: 'agent-1',
          name: 'Legal validator',
          specializationId: 'spec-1',
          rule: SPECIALIZATION_AGENT_RULES.validator,
        },
      ],
      totalCount: 1,
      page: 0,
      size: 100,
    });

    const result = await backfillSpecializationAgentRules();

    expect(result.updatedCount).toBe(0);
    expect(mockUpdateSystemAgent).not.toHaveBeenCalled();
  });
});
