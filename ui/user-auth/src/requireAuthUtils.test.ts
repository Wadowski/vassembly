import { describe, it, expect } from 'vitest';
import { hasRoleAccess } from './requireAuthUtils';

describe('hasRoleAccess', () => {
  describe('when no required roles', () => {
    it('should return true regardless of user roles', () => {
      expect(hasRoleAccess({ userRoles: [] })).toBe(true);
      expect(hasRoleAccess({ userRoles: ['admin'] })).toBe(true);
      expect(hasRoleAccess({ userRoles: ['user', 'moderator'] })).toBe(true);
    });

    it('should return true when requiredRoles is empty', () => {
      expect(hasRoleAccess({ userRoles: ['admin'], requiredRoles: [] })).toBe(true);
    });
  });

  describe('with "any" match strategy', () => {
    it('should return true if user has at least one required role', () => {
      expect(
        hasRoleAccess({
          userRoles: ['admin', 'user'],
          requiredRoles: ['admin'],
          match: 'any',
        }),
      ).toBe(true);
    });

    it('should return true if user has multiple required roles', () => {
      expect(
        hasRoleAccess({
          userRoles: ['admin', 'moderator', 'user'],
          requiredRoles: ['admin', 'moderator'],
          match: 'any',
        }),
      ).toBe(true);
    });

    it('should return false if user has none of the required roles', () => {
      expect(
        hasRoleAccess({
          userRoles: ['user'],
          requiredRoles: ['admin', 'moderator'],
          match: 'any',
        }),
      ).toBe(false);
    });

    it('should be the default match strategy', () => {
      expect(
        hasRoleAccess({
          userRoles: ['admin'],
          requiredRoles: ['admin', 'moderator'],
        }),
      ).toBe(true);
    });
  });

  describe('with "all" match strategy', () => {
    it('should return true if user has all required roles', () => {
      expect(
        hasRoleAccess({
          userRoles: ['admin', 'moderator', 'user'],
          requiredRoles: ['admin', 'moderator'],
          match: 'all',
        }),
      ).toBe(true);
    });

    it('should return false if user is missing any required role', () => {
      expect(
        hasRoleAccess({
          userRoles: ['admin', 'user'],
          requiredRoles: ['admin', 'moderator'],
          match: 'all',
        }),
      ).toBe(false);
    });

    it('should return false if user has no required roles', () => {
      expect(
        hasRoleAccess({
          userRoles: ['user'],
          requiredRoles: ['admin', 'moderator'],
          match: 'all',
        }),
      ).toBe(false);
    });
  });
});
