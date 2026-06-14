import { describe, it, expect, vi } from 'vitest';

vi.mock('@vassembly/config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key-for-testing',
    },
  },
}));

import { create, verify, decode } from './index';
import { UnauthorizedError } from '@vassembly/errors';

describe('JWT Client', () => {
  const testPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'admin',
  };

  describe('create', () => {
    it('should create a valid token with provided data', async () => {
      const token = await create({ data: testPayload });

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('should create token with custom options', async () => {
      const token = await create({
        data: testPayload,
        options: { expiresIn: '1h', algorithm: 'HS512' },
      });

      const decoded = await decode(token);
      expect(decoded?.userId).toBe('user-123');
    });
  });

  describe('verify', () => {
    it('should verify and return valid token payload', async () => {
      const token = await create({ data: testPayload });
      const payload = await verify({ token });

      expect(payload.userId).toBe('user-123');
      expect(payload.email).toBe('test@example.com');
      expect(payload.role).toBe('admin');
    });

    it('should throw on invalid token', async () => {
      await expect(verify({ token: 'invalid.token.here' })).rejects.toThrow(UnauthorizedError);
    });

    it('should throw on tampered token', async () => {
      const token = await create({ data: testPayload });
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      await expect(verify({ token: tamperedToken })).rejects.toThrow(UnauthorizedError);
    });

    it('should verify token with custom options', async () => {
      const token = await create({
        data: testPayload,
        options: { expiresIn: '1h' },
      });

      const payload = await verify({ token });
      expect(payload.userId).toBe('user-123');
    });
  });

  describe('decode', () => {
    it('should decode token without verification', async () => {
      const token = await create({ data: testPayload });
      const decoded = await decode(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('user-123');
      expect(decoded?.email).toBe('test@example.com');
    });

    it('should return null for invalid token', async () => {
      const decoded = await decode('invalid.token.format');
      expect(decoded).toBeNull();
    });

    it('should decode expired token without verification', async () => {
      const token = await create({
        data: testPayload,
        options: { expiresIn: '0s' },
      });

      setTimeout(async () => {
        const decoded = await decode(token);

        expect(decoded).not.toBeNull();
        expect(decoded?.userId).toBe('user-123');
      }, 100);
    });
  });

  describe('integration', () => {
    it('should handle complete flow: create, decode, verify', async () => {
      const token = await create({ data: testPayload });

      const decodedData = await decode(token);
      expect(decodedData?.userId).toBe('user-123');

      const verifiedData = await verify({ token });
      expect(verifiedData.userId).toBe('user-123');
      expect(verifiedData.email).toBe('test@example.com');
    });
  });
});
