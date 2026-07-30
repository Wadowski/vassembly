import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetModelById } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: { getModelById: mockGetModelById },
  },
}));

import { resolvePlanItemAgentRole } from './resolvePlanItemAgentRole';

const AGENT_ID = '507f1f77bcf86cd799439011';

describe('resolvePlanItemAgentRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve role from agent name suffix', async () => {
    mockGetModelById.mockResolvedValue({ data: { name: 'Legal validator' } });

    const role = await resolvePlanItemAgentRole({ agentId: AGENT_ID });

    expect(role).toBe('validator');
  });

  it('should fall back to worker when role cannot be resolved', async () => {
    mockGetModelById.mockResolvedValue({ data: { name: 'Task planner' } });

    const role = await resolvePlanItemAgentRole({ agentId: AGENT_ID });

    expect(role).toBe('worker');
  });
});
