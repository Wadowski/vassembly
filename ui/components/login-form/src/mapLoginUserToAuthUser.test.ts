import { describe, it, expect } from 'vitest';
import { mapLoginUserToAuthUser } from './mapLoginUserToAuthUser';

describe('mapLoginUserToAuthUser', () => {
  it('should map a full API user payload to AuthUser with id and email', () => {
    const result = mapLoginUserToAuthUser({
      id: 'user123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(result).toEqual({
      id: 'user123',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
    });
  });

  it('should map a minimal user with id and email only', () => {
    const result = mapLoginUserToAuthUser({ id: 'a', email: 'a@a.com' });
    expect(result.id).toBe('a');
    expect(result.email).toBe('a@a.com');
  });

  it('should not require firstName or lastName', () => {
    const result = mapLoginUserToAuthUser({ id: 'user123', email: 'user@example.com' });
    expect(result).toEqual({
      id: 'user123',
      email: 'user@example.com',
      firstName: undefined,
      lastName: undefined,
    });
  });

  it('should allow email to be undefined when missing from the payload', () => {
    const result = mapLoginUserToAuthUser({ id: 'user123' });
    expect(result).toEqual({
      id: 'user123',
      email: undefined,
      firstName: undefined,
      lastName: undefined,
    });
  });
});
