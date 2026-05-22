import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

const { mockAuthorize, mockDeleteAgent } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockDeleteAgent: vi.fn(),
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
    deleteAgent: mockDeleteAgent,
    restoreAgent: vi.fn(),
  },
}));

import { agentDeleteRoute } from './delete';

describe('DELETE /agents/:id route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should acknowledge soft delete success responses', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockDeleteAgent.mockResolvedValue({ success: true, message: 'Agent deleted' });

    const result = await agentDeleteRoute.handler({
      body: {},
      query: {},
      headers: { authorization: 'Bearer token' },
      params: { id: 'agent-1' },
    } as never);

    expect(result).toEqual({ success: true, message: 'Agent deleted' });
  });

  it('should bubble missing-resource semantics for foreign identifiers', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-2' });
    mockDeleteAgent.mockRejectedValue(new NotFoundError('Agent not found'));

    await expect(
      agentDeleteRoute.handler({
        body: {},
        query: {},
        headers: { authorization: 'Bearer token' },
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(NotFoundError);
  });

  it('should refuse delete attempts without credentials', async () => {
    mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

    await expect(
      agentDeleteRoute.handler({
        body: {},
        query: {},
        headers: {},
        params: { id: 'agent-1' },
      } as never),
    ).rejects.toThrow(UnauthorizedError);
  });
});
