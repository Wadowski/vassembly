import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UnauthorizedError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

const { mockAuthorize, mockCreateAgent } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockCreateAgent: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-agent', () => ({
  default: {
    createAgent: mockCreateAgent,
    listAgents: vi.fn(),
    getAgent: vi.fn(),
    updateAgent: vi.fn(),
    deleteAgent: vi.fn(),
    restoreAgent: vi.fn(),
  },
}));

import { agentCreateBodySchema, agentCreateRoute } from './create';

describe('POST /agents route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a persisted agent payload after authorize succeeds', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockCreateAgent.mockResolvedValue({
      agent: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Helper',
        category: 'coding',
        description: 'Does work',
        rule: 'Be kind',
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    });

    const body = {
      name: 'Helper',
      category: 'coding' as const,
      description: 'Does work',
      rule: 'Be kind',
    };

    const result = await agentCreateRoute.handler({
      body,
      query: {},
      headers: { authorization: 'Bearer token' },
    });

    expect(result).toMatchObject({
      id: 'agent-1',
      userId: 'user-1',
      status: 'active',
      removedAt: null,
      ...body,
    });
  });

  it('should reject unauthenticated callers before invoking service handlers', async () => {
    mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

    await expect(
      agentCreateRoute.handler({
        body: {
          name: 'Helper',
          category: 'coding',
          description: 'Does work',
          rule: 'Be kind',
        },
        query: {},
        headers: {},
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should reject bodies that violate documented maximum lengths', () => {
    const validateAgentCreateBody = validatorFactory(agentCreateBodySchema);
    const parsed = validateAgentCreateBody({
      name: 'x'.repeat(101),
      category: 'coding',
      description: 'ok',
      rule: 'ok',
    });

    expect(parsed.success).toBe(false);
  });
});
