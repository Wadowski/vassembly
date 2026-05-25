import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockUpsert } = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
}));

vi.mock('../../clients', () => ({
  userSystemAgentPreferenceMongodbDao: {
    upsert: mockUpsert,
  },
}));

import { upsertPreference } from './index';

const USER_ID = 'user-1';
const CREDENTIAL_ID = 'cred-1';

describe('upsertPreference system agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create preference document when none exists for userId', async () => {
    const createdAt = new Date('2026-02-01T00:00:00.000Z');
    mockUpsert.mockResolvedValue({
      data: {
        userId: USER_ID,
        integrationCredentialId: CREDENTIAL_ID,
        createdAt,
        updatedAt: createdAt,
      },
    });

    const result = await upsertPreference({
      userId: USER_ID,
      integrationCredentialId: CREDENTIAL_ID,
    });

    expect(result.data.userId).toBe(USER_ID);
    expect(result.data.integrationCredentialId).toBe(CREDENTIAL_ID);
    expect(result.data.createdAt).toEqual(createdAt);
  });

  it('should update integrationCredentialId when preference already exists for userId', async () => {
    const createdAt = new Date('2026-02-01T00:00:00.000Z');
    const updatedAt = new Date('2026-03-01T00:00:00.000Z');
    mockUpsert.mockResolvedValue({
      data: {
        userId: USER_ID,
        integrationCredentialId: 'cred-2',
        createdAt,
        updatedAt,
      },
    });

    const result = await upsertPreference({
      userId: USER_ID,
      integrationCredentialId: 'cred-2',
    });

    expect(result.data.integrationCredentialId).toBe('cred-2');
    expect(result.data.createdAt).toEqual(createdAt);
    expect(result.data.updatedAt).toEqual(updatedAt);
  });

  it('should reject upsert when userId is missing', async () => {
    await expect(
      upsertPreference({
        userId: '',
        integrationCredentialId: CREDENTIAL_ID,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject upsert when integrationCredentialId is missing', async () => {
    await expect(
      upsertPreference({
        userId: USER_ID,
        integrationCredentialId: '',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
