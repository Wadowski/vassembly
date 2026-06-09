import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnauthorizedError, ValidationError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

const AUTH_HEADERS = {
  authorization: 'Bearer valid-jwt-token-user-123',
};

const { mockAuthorize, mockTestMcpConnection } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockTestMcpConnection: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-mcp', () => ({
  default: {
    testMcpConnection: mockTestMcpConnection,
  },
}));

import {
  testMcpConfigurationBodySchema,
  testMcpConfigurationRoute,
} from '../../src/routes/mcps/testConfiguration';
import { mcpConfigurationRoutes } from '../../src/routes/mcps/index';
import { injectMcpConfigRequest } from '../rest-test-utils';

describe('REST: POST /mcps/:mcpId/configuration/test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue({ userId: 'user-123' });
  });

  describe('test connection', () => {
    it('should return success on valid connection', async () => {
      mockTestMcpConnection.mockResolvedValue({ success: true, message: 'Connection verified' });

      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/gmail/configuration/test',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: {
          fieldValues: { apiKey: 'valid-key', refreshToken: 'valid-token' },
          useSavedSecrets: false,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        success: true,
      });
    });

    it('should return failure on invalid connection', async () => {
      mockTestMcpConnection.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/gmail/configuration/test',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: {
          fieldValues: { apiKey: 'invalid-key', refreshToken: 'invalid' },
          useSavedSecrets: false,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        success: false,
        error: expect.any(String),
      });
    });

    it('should return 401 when unauthorized', async () => {
      mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/gmail/configuration/test',
        routes: mcpConfigurationRoutes,
        payload: {
          fieldValues: { apiKey: 'key' },
          useSavedSecrets: false,
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate request body against schema', async () => {
      const validateBody = validatorFactory(testMcpConfigurationBodySchema);
      const parsed = validateBody({
        fieldValues: {},
        useSavedSecrets: false,
      });

      expect(parsed.success).toBe(false);

      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/gmail/configuration/test',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: {
          fieldValues: {},
          useSavedSecrets: false,
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        type: expect.any(String),
        message: expect.any(String),
      });
    });
  });

  describe('route handler', () => {
    it('should propagate service validation errors', async () => {
      mockTestMcpConnection.mockRejectedValue(new ValidationError('apiKey is required'));

      await expect(
        testMcpConfigurationRoute.handler({
          params: { mcpId: 'gmail' },
          body: {
            fieldValues: { apiKey: 'key' },
            useSavedSecrets: false,
          },
          query: {},
          headers: AUTH_HEADERS,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
