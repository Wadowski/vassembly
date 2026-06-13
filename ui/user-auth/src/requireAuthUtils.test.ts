import { describe, it, expect } from 'vitest';
import { hasRoleAccess } from './requireAuthUtils';

describe('hasRoleAccess', () => {
  describe('when no required roles', () => {
    it('should return true regardless of user role', () => {
      expect(hasRoleAccess({ userRole: '' })).toBe(true);
      expect(hasRoleAccess({ userRole: 'admin' })).toBe(true);
      expect(hasRoleAccess({ userRole: 'user' })).toBe(true);
    });

    it('should return true when requiredRoles is empty', () => {
      expect(hasRoleAccess({ userRole: 'admin', requiredRoles: [] })).toBe(true);
    });
  });

  describe('with "any" match strategy', () => {
    it('should return true if user has a required role', () => {
      expect(
        hasRoleAccess({
          userRole: 'admin',
          requiredRoles: ['admin'],
          match: 'any',
        }),
      ).toBe(true);
    });

    it('should return true if user role matches one of multiple required roles', () => {
      expect(
        hasRoleAccess({
          userRole: 'admin',
          requiredRoles: ['admin', 'moderator'],
          match: 'any',
        }),
      ).toBe(true);
    });

    it('should return false if user role does not match any required role', () => {
      expect(
        hasRoleAccess({
          userRole: 'user',
          requiredRoles: ['admin', 'moderator'],
          match: 'any',
        }),
      ).toBe(false);
    });

    it('should be the default match strategy', () => {
      expect(
        hasRoleAccess({
          userRole: 'admin',
          requiredRoles: ['admin', 'moderator'],
        }),
      ).toBe(true);
    });
  });

  describe('with "all" match strategy', () => {
    it('should return true if user role matches the single required role', () => {
      expect(
        hasRoleAccess({
          userRole: 'admin',
          requiredRoles: ['admin'],
          match: 'all',
        }),
      ).toBe(true);
    });

    it('should return false if user role does not match all required roles', () => {
      expect(
        hasRoleAccess({
          userRole: 'admin',
          requiredRoles: ['admin', 'moderator'],
          match: 'all',
        }),
      ).toBe(false);
    });

    it('should return false if user role does not match any required role', () => {
      expect(
        hasRoleAccess({
          userRole: 'user',
          requiredRoles: ['admin', 'moderator'],
          match: 'all',
        }),
      ).toBe(false);
    });
  });
});
