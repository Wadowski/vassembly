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

vi.mock('@vassembly/domain-system-agent', async () => {
  const domain = await import('../../../../../domains/system-agent/src/index.js');

  return {
    ...domain,
    default: {
      commands: {},
      queries: {
        getPreferenceByUserId: mockGetPreferenceByUserId,
      },
    },
  };
});

import { getConnectionPreference } from './index';

describe('getConnectionPreference handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertHasRole.mockResolvedValue(undefined);
  });

  it('should return userId and integrationCredentialId when preference exists', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({
      data: {
        userId: 'user-1',
        integrationCredentialId: 'cred-1',
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    });

    const result = await getConnectionPreference({
      userId: 'user-1',
    });

    expect(result.preference.userId).toBe('user-1');
    expect(result.preference.integrationCredentialId).toBe('cred-1');
    expect(mockAssertHasRole).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when user has no saved preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });

    await expect(
      getConnectionPreference({
        userId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when non-admin reads another users preference', async () => {
    mockAssertHasRole.mockRejectedValue(new ForbiddenError('Admin access required'));

    await expect(
      getConnectionPreference({
        userId: 'user-1',
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should return preference when admin reads another users preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({
      data: {
        userId: 'user-2',
        integrationCredentialId: 'cred-2',
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    });

    const result = await getConnectionPreference({
      userId: 'admin-1',
      targetUserId: 'user-2',
    });

    expect(result.preference.userId).toBe('user-2');
    expect(result.preference.integrationCredentialId).toBe('cred-2');
  });
});
