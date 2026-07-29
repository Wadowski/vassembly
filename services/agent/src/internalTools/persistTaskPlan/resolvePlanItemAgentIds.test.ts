import { describe, expect, it, vi } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const { mockGetBySpecializationId } = vi.hoisted(() => ({
  mockGetBySpecializationId: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: { getBySpecializationId: mockGetBySpecializationId },
  },
}));

import { resolvePlanItemAgentIds } from './resolvePlanItemAgentIds';

const WORKER_AGENT_ID = '507f1f77bcf86cd799439011';
const SPECIALIZATION_ID = '507f1f77bcf86cd799439012';

describe('resolvePlanItemAgentIds', () => {
  it('should resolve exact worker agent names to MongoDB ids', async () => {
    mockGetBySpecializationId.mockResolvedValue({
      items: [
        { id: WORKER_AGENT_ID, name: 'Legal worker' },
        { id: 'researcher-id', name: 'Legal researcher' },
      ],
    });

    const result = await resolvePlanItemAgentIds({
      specializationIds: [SPECIALIZATION_ID],
      items: [{ agentName: 'Legal worker' }],
    });

    expect(result).toEqual([{ agentName: 'Legal worker', agentId: WORKER_AGENT_ID }]);
  });

  it('should reject placeholder agent names', async () => {
    mockGetBySpecializationId.mockResolvedValue({
      items: [{ id: WORKER_AGENT_ID, name: 'Legal worker' }],
    });

    await expect(
      resolvePlanItemAgentIds({
        specializationIds: [SPECIALIZATION_ID],
        items: [{ agentName: 'worker_1' }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject researcher agent names for plan items', async () => {
    mockGetBySpecializationId.mockResolvedValue({
      items: [
        { id: WORKER_AGENT_ID, name: 'Legal worker' },
        { id: 'researcher-id', name: 'Legal researcher' },
      ],
    });

    await expect(
      resolvePlanItemAgentIds({
        specializationIds: [SPECIALIZATION_ID],
        items: [{ agentName: 'Legal researcher' }],
      }),
    ).rejects.toThrow(ValidationError);
  });
});
