import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const { mockGetPreferenceByUserId } = vi.hoisted(() => ({
  mockGetPreferenceByUserId: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: { getPreferenceByUserId: mockGetPreferenceByUserId },
  },
}));

import { resolveSystemCallCredentialId } from './resolveSystemCallCredentialId';

describe('resolveSystemCallCredentialId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return integrationCredentialId when user preference exists', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({
      data: { integrationCredentialId: 'cred-abc' },
    });

    const result = await resolveSystemCallCredentialId({ userId: 'user-1' });

    expect(result).toBe('cred-abc');
  });

  it('should throw ValidationError when preference has no credential', async () => {
    mockGetPreferenceByUserId.mockResolvedValue({ data: null });

    await expect(resolveSystemCallCredentialId({ userId: 'user-1' })).rejects.toThrow(
      ValidationError,
    );
  });
});
