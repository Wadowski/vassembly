import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

const { mockAuthorize, mockGetAgent } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockGetAgent: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-agent', () => ({
  default: {
    createAgent: vi.fn(),
    listAgents: vi.fn(),
    getAgent: mockGetAgent,
    updateAgent: vi.fn(),
    deleteAgent: vi.fn(),
    restoreAgent: vi.fn(),
  },
}));

import { agentGetByIdRoute } from './getById';

describe('GET /agents/:id route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the owned agent document', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockGetAgent.mockResolvedValue({
      agent: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Scoped',
        category: 'utility',
        description: 'd',
        rule: 'r',
        status: 'active',
        removedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const result = await agentGetByIdRoute.handler({
      body: {},
      query: {},
      headers: { authorization: 'Bearer token' },
      params: { id: 'agent-1' },
    } as never);

    expect(result).toMatchObject({ id: 'agent-1', userId: 'user-1' });
  });

  it('should respond with NotFoundError when service denies identifier visibility', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-2' });
    mockGetAgent.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(
      agentGetByIdRoute.handler({
        body: {},
        query: {},
        headers: { authorization: 'Bearer token' },
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(NotFoundError);
  });

  it('should reject unauthenticated reads before touching persistence', async () => {
    mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

    await expect(
      agentGetByIdRoute.handler({
        body: {},
        query: {},
        headers: {},
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(UnauthorizedError);
  });
});
