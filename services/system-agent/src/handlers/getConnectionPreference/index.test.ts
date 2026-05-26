import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError } from '@vassembly/errors';
import { AuthTokenRole } from '@vassembly/domain-auth-token';

const { mockGetPreferenceByUserId } = vi.hoisted(() => ({
  mockGetPreferenceByUserId: vi.fn(),
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
      userId: 'admin-1',
      role: AuthTokenRole.ADMIN,
    });

    expect(result.preference.userId).toBe('user-1');
    expect(result.preference.integrationCredentialId).toBe('cred-1');
  });

  it('should throw NotFoundError when user has no saved preference', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });

    await expect(
      getConnectionPreference({
        userId: 'admin-1',
        role: AuthTokenRole.ADMIN,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    await expect(
      getConnectionPreference({
        userId: 'user-1',
        role: AuthTokenRole.USER,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError when user attempts to read another users preference', async () => {
    await expect(
      getConnectionPreference({
        userId: 'admin-1',
        role: AuthTokenRole.ADMIN,
        targetUserId: 'user-2',
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
