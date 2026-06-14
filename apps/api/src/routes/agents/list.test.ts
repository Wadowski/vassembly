import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UnauthorizedError } from '@vassembly/errors';

const { mockAuthorize, mockListAgents } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockListAgents: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-agent', () => ({
  default: {
    createAgent: vi.fn(),
    listAgents: mockListAgents,
    getAgent: vi.fn(),
    updateAgent: vi.fn(),
    deleteAgent: vi.fn(),
    restoreAgent: vi.fn(),
  },
}));

import { agentListRoute, agentListResponseSchema } from './list';
import type { z } from 'zod';

describe('GET /agents route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should forward pagination search and status filters to the list handler', async () => {
    mockAuthorize.mockResolvedValue({ userId: 'user-1' });
    mockListAgents.mockResolvedValue({
      items: [{ id: 'a1', userId: 'user-1' }],
      totalCount: 1,
      page: 1,
      size: 5,
    });

    const result = (await agentListRoute.handler({
      body: {},
      query: {
        page: 1,
        size: 5,
        search: 'alpha',
        status: 'archived',
      },
      headers: { authorization: 'Bearer token' },
    })) as z.infer<typeof agentListResponseSchema>;

    expect(result.totalCount).toBe(1);
    expect(result.page).toBe(1);
    expect(result.size).toBe(5);
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('should block listing when authorization fails', async () => {
    mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

    await expect(
      agentListRoute.handler({
        body: {},
        query: { page: 0, size: 10 },
        headers: {},
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
