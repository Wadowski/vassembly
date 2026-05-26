import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import { ForbiddenError, NotFoundError, ValidationError } from '@vassembly/errors';

import type { UserModel } from '../../model';
import { assertHasRole } from './index';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetModelById } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
}));

vi.mock('../getModelById', () => ({
  getModelById: mockGetModelById,
}));

const VALID_USER_ID = '507f1f77bcf86cd799439011';

const buildUser = (
  overrides: Partial<UserModel & { role?: AUTH_TOKEN_ROLE }> = {},
): UserModel & { role?: AUTH_TOKEN_ROLE } => ({
  id: overrides.id ?? VALID_USER_ID,
  email: overrides.email ?? 'user@example.com',
  firstName: overrides.firstName ?? 'Jane',
  lastName: overrides.lastName ?? 'Doe',
  ...overrides,
} as UserModel & { role?: AUTH_TOKEN_ROLE });

describe('assertHasRole user query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw ForbiddenError when user not found', async () => {
    mockGetModelById.mockRejectedValue(
      new NotFoundError(`Instance with id ${VALID_USER_ID} not found`),
    );

    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: AUTH_TOKEN_ROLE.USER }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw ForbiddenError with correct message when user role is insufficient', async () => {
    mockGetModelById.mockResolvedValue({
      data: buildUser({ role: AUTH_TOKEN_ROLE.USER }),
    });

    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: AUTH_TOKEN_ROLE.ADMIN }),
    ).rejects.toThrow(new ForbiddenError('Admin access required'));
  });

  it('should succeed when user role matches required role exactly', async () => {
    mockGetModelById.mockResolvedValue({
      data: buildUser({ role: AUTH_TOKEN_ROLE.ADMIN }),
    });

    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: AUTH_TOKEN_ROLE.ADMIN }),
    ).resolves.toBeUndefined();
  });

  it('should treat missing user.role field as USER role', async () => {
    mockGetModelById.mockResolvedValue({
      data: buildUser({ role: undefined }),
    });

    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: AUTH_TOKEN_ROLE.USER }),
    ).resolves.toBeUndefined();
  });

  it('should support checking for ADMIN role', async () => {
    mockGetModelById.mockResolvedValue({
      data: buildUser({ role: AUTH_TOKEN_ROLE.ADMIN }),
    });

    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: AUTH_TOKEN_ROLE.ADMIN }),
    ).resolves.toBeUndefined();
  });

  it('should support checking for USER role', async () => {
    mockGetModelById.mockResolvedValue({
      data: buildUser({ role: AUTH_TOKEN_ROLE.USER }),
    });

    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: AUTH_TOKEN_ROLE.USER }),
    ).resolves.toBeUndefined();
  });

  it('should throw ValidationError when userId is empty or invalid', async () => {
    await expect(
      assertHasRole({ userId: '', role: AUTH_TOKEN_ROLE.USER }),
    ).rejects.toThrow(ValidationError);

    await expect(
      assertHasRole({ userId: '   ', role: AUTH_TOKEN_ROLE.USER }),
    ).rejects.toThrow(ValidationError);

    await expect(
      assertHasRole({ userId: 'not-a-valid-object-id', role: AUTH_TOKEN_ROLE.USER }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when role is invalid', async () => {
    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: 'administrator' as AUTH_TOKEN_ROLE }),
    ).rejects.toThrow(ValidationError);

    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: 'Admin' as AUTH_TOKEN_ROLE }),
    ).rejects.toThrow(ValidationError);
  });

  it('should not allow privilege escalation when non-admin user is checked for admin role', async () => {
    mockGetModelById.mockResolvedValue({
      data: buildUser({ role: AUTH_TOKEN_ROLE.USER }),
    });

    await expect(
      assertHasRole({ userId: VALID_USER_ID, role: AUTH_TOKEN_ROLE.ADMIN }),
    ).rejects.toThrow(new ForbiddenError('Admin access required'));
  });
});
