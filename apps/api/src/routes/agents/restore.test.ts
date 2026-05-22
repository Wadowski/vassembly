import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, UnauthorizedError, WrongParamError } from '@vassembly/errors';

const { mockAuthorize, mockRestoreAgent } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockRestoreAgent: vi.fn(),
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
    updateAgent: vi.fn(),
    deleteAgent: vi.fn(),
    restoreAgent: mockRestoreAgent,
  },
}));

import { agentRestoreRoute } from './restore';

describe('POST /agents/:id/restore route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should surface fully active agents after restore completes', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockRestoreAgent.mockResolvedValue({
      agent: {
        id: 'agent-1',
        userId: 'user-1',
        name: 'Back',
        category: 'coding',
        description: 'd',
        rule: 'r',
        status: 'active',
        removedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const result = await agentRestoreRoute.handler({
      body: {},
      query: {},
      headers: { authorization: 'Bearer token' },
      params: { id: 'agent-1' },
    } as never);

    expect(result.removedAt).toBeNull();
    expect(result.status).toBe('active');
  });

  it('should explain illegal restore operations for agents still active', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockRestoreAgent.mockRejectedValue(new WrongParamError('Agent not archived'));

    await expect(
      agentRestoreRoute.handler({
        body: {},
        query: {},
        headers: { authorization: 'Bearer token' },
        params: { id: 'agent-live' },
      } as never),
    ).rejects.toThrow(WrongParamError);
  });

  it('should hide foreign identifiers behind generic missing semantics', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-3' });
    mockRestoreAgent.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(
      agentRestoreRoute.handler({
        body: {},
        query: {},
        headers: { authorization: 'Bearer token' },
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(NotFoundError);
  });

  it('should require authentication before invoking restore workflow', async () => {
    mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

    await expect(
      agentRestoreRoute.handler({
        body: {},
        query: {},
        headers: {},
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(UnauthorizedError);
  });
});
