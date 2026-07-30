import { beforeEach, describe, expect, it, vi } from 'vitest';

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
const RESEARCHER_AGENT_ID = '507f1f77bcf86cd799439012';
const VALIDATOR_AGENT_ID = '507f1f77bcf86cd799439013';
const SPECIALIZATION_ID = '507f1f77bcf86cd799439014';

describe('resolvePlanItemAgentIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBySpecializationId.mockResolvedValue({
      items: [
        { id: WORKER_AGENT_ID, name: 'Legal worker' },
        { id: RESEARCHER_AGENT_ID, name: 'Legal researcher' },
        { id: VALIDATOR_AGENT_ID, name: 'Legal validator' },
      ],
    });
  });

  it('should resolve worker, researcher, and validator agent names', async () => {
    const result = await resolvePlanItemAgentIds({
      specializationIds: [SPECIALIZATION_ID],
      items: [
        { agentName: 'Legal worker' },
        { agentName: 'Legal researcher' },
        { agentName: 'Legal validator' },
      ],
    });

    expect(result).toEqual([
      { agentName: 'Legal worker', agentId: WORKER_AGENT_ID },
      { agentName: 'Legal researcher', agentId: RESEARCHER_AGENT_ID },
      { agentName: 'Legal validator', agentId: VALIDATOR_AGENT_ID },
    ]);
  });

  it('should reject placeholder agent names', async () => {
    await expect(
      resolvePlanItemAgentIds({
        specializationIds: [SPECIALIZATION_ID],
        items: [{ agentName: 'worker_1' }],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw when no specialization agents are available', async () => {
    mockGetBySpecializationId.mockResolvedValue({
      items: [{ id: 'task-worker-id', name: 'Task worker' }],
    });

    await expect(
      resolvePlanItemAgentIds({
        specializationIds: [SPECIALIZATION_ID],
        items: [{ agentName: 'Legal worker' }],
      }),
    ).rejects.toThrow('No specialization agents (researcher, worker, or validator) found');
  });
});
