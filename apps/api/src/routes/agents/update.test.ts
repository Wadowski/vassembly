import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, UnauthorizedError, WrongParamError } from '@vassembly/errors';

const { mockAuthorize, mockUpdateAgent } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockUpdateAgent: vi.fn(),
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
    getAgent: vi.fn(),
    updateAgent: mockUpdateAgent,
    deleteAgent: vi.fn(),
    restoreAgent: vi.fn(),
  },
}));

import { agentPatchRoute } from './update';

describe('PATCH /agents/:id route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return updated agent JSON on success', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockUpdateAgent.mockResolvedValue({
      agent: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Renamed',
        category: 'coding',
        description: 'd',
        rule: 'r',
        status: 'active',
        removedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const result = await agentPatchRoute.handler({
      body: { name: 'Renamed' },
      query: {},
      headers: { authorization: 'Bearer token' },
      params: { id: 'agent-1' },
    } as never);

    expect(result).toMatchObject({ id: 'agent-1', name: 'Renamed' });
  });

  it('should map soft-deleted conflicts to explicit business errors', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockUpdateAgent.mockRejectedValue(
      new WrongParamError('Agent has been deleted; restore before updating.'),
    );

    await expect(
      agentPatchRoute.handler({
        body: { name: 'X' },
        query: {},
        headers: { authorization: 'Bearer token' },
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(WrongParamError);
  });

  it('should treat cross-user mutation attempts as missing records', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-9' });
    mockUpdateAgent.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(
      agentPatchRoute.handler({
        body: { name: 'X' },
        query: {},
        headers: { authorization: 'Bearer token' },
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(NotFoundError);
  });

  it('should require authentication', async () => {
    mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

    await expect(
      agentPatchRoute.handler({
        body: { name: 'X' },
        query: {},
        headers: {},
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(UnauthorizedError);
  });
});
