import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError } from '@vassembly/errors';

const { mockAuthorizeAdminRequest, mockArchiveSkill } = vi.hoisted(() => ({
  mockAuthorizeAdminRequest: vi.fn(),
  mockArchiveSkill: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeAdminRequest: mockAuthorizeAdminRequest,
  },
}));

vi.mock('@vassembly/service-skill', () => ({
  default: {
    archiveSkill: mockArchiveSkill,
  },
}));

import { skillArchiveRoute } from './archive';

describe('DELETE /skills/:id route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return archived skill when admin deletes skill', async () => {
    mockAuthorizeAdminRequest.mockResolvedValue({ userId: 'admin-1' });
    mockArchiveSkill.mockResolvedValue({
      skill: {
        id: 'skill-1',
        name: 'contract-review',
        removedAt: '2026-04-01T00:00:00.000Z',
      },
    });

    const result = await skillArchiveRoute.handler({
      body: {},
      query: {},
      headers: { authorization: 'Bearer token' },
      params: { id: 'skill-1' },
    } as never);

    expect(result).toEqual(
      expect.objectContaining({
        id: 'skill-1',
        removedAt: '2026-04-01T00:00:00.000Z',
      }),
    );
    expect(mockArchiveSkill).toHaveBeenCalledWith({
      adminUserId: 'admin-1',
      skillId: 'skill-1',
    });
  });

  it('should bubble NotFoundError when skill is missing', async () => {
    mockAuthorizeAdminRequest.mockResolvedValue({ userId: 'admin-1' });
    mockArchiveSkill.mockRejectedValue(new NotFoundError('Skill not found'));

    await expect(
      skillArchiveRoute.handler({
        body: {},
        query: {},
        headers: { authorization: 'Bearer token' },
        params: { id: 'missing-id' },
      } as never),
    ).rejects.toThrow(NotFoundError);
  });

  it('should refuse archive attempts without admin credentials', async () => {
    mockAuthorizeAdminRequest.mockRejectedValue(new ForbiddenError('Admin access required'));

    await expect(
      skillArchiveRoute.handler({
        body: {},
        query: {},
        headers: {},
        params: { id: 'skill-1' },
      } as never),
    ).rejects.toThrow(ForbiddenError);
  });
});
