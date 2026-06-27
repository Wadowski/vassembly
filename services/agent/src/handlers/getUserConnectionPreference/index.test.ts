import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError } from '@vassembly/errors';

const { mockAssertHasRole, mockGetPreferenceByUserId } = vi.hoisted(() => ({
  mockAssertHasRole: vi.fn(),
  mockGetPreferenceByUserId: vi.fn(),
}));

vi.mock('@vassembly/domain-user', () => ({
  default: {
    queries: {
      assertHasRole: mockAssertHasRole,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    commands: {},
    queries: {
      getPreferenceByUserId: mockGetPreferenceByUserId,
    },
  },
}));

import { getUserConnectionPreference } from './index';

describe('getUserConnectionPreference handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertHasRole.mockResolvedValue(undefined);
  });

  it('should return preference when admin reads target user preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({
      data: {
        userId: 'user-2',
        integrationCredentialId: 'cred-2',
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    });

    const result = await getUserConnectionPreference({
      adminUserId: 'admin-1',
      targetUserId: 'user-2',
    });

    expect(result.preference.userId).toBe('user-2');
    expect(result.preference.integrationCredentialId).toBe('cred-2');
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    mockAssertHasRole.mockRejectedValue(new ForbiddenError('Admin access required'));

    await expect(
      getUserConnectionPreference({
        adminUserId: 'user-1',
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw NotFoundError when target user has no preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });

    await expect(
      getUserConnectionPreference({
        adminUserId: 'admin-1',
        targetUserId: 'user-without-pref',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
