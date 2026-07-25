import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError, UnauthorizedError, ValidationError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';

const MOCK_MASKED_CONFIGURATION = {
  id: 'config-gmail-1',
  userId: 'user-123',
  mcpId: 'gmail',
  status: 'configured',
  enabled: true,
  fieldValues: [
    { key: 'apiKey', hasSecret: true },
    { key: 'refreshToken', hasSecret: true },
  ],
  createdAt: '2026-06-08T12:00:00.000Z',
  updatedAt: '2026-06-08T12:00:00.000Z',
};

const VALID_BODY = {
  fieldValues: { apiKey: 'key123', refreshToken: 'refresh456' },
};

const AUTH_HEADERS = {
  authorization: 'Bearer valid-jwt-token-user-123',
};

const { mockAuthorize, mockCreateUserMcpConfiguration } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockCreateUserMcpConfiguration: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-mcp', () => ({
  default: {
    createUserMcpConfiguration: mockCreateUserMcpConfiguration,
  },
}));

import {
  createMcpConfigurationBodySchema,
  createMcpConfigurationRoute,
} from '../../src/routes/mcps/createConfiguration';
import { mcpConfigurationRoutes } from '../../src/routes/mcps/index';
import { injectMcpConfigRequest } from '../rest-test-utils';

describe('REST: POST /mcps/:mcpId/configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue({ userId: 'user-123' });
    mockCreateUserMcpConfiguration.mockResolvedValue(MOCK_MASKED_CONFIGURATION);
  });

  describe('creation', () => {
    it('should create configuration and return 201', async () => {
      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/gmail/configuration',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: VALID_BODY,
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toMatchObject({
        id: expect.any(String),
        mcpId: 'gmail',
        status: 'configured',
      });
    });

    it('should reject missing required fields with 400', async () => {
      mockCreateUserMcpConfiguration.mockRejectedValue(
        new ValidationError('refreshToken is required'),
      );

      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/gmail/configuration',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: {
          fieldValues: { apiKey: 'key123' },
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        type: expect.any(String),
        message: expect.any(String),
      });
    });

    it('should return 401 when auth is missing', async () => {
      mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/gmail/configuration',
        routes: mcpConfigurationRoutes,
        payload: VALID_BODY,
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toMatchObject({
        type: 'UNAUTHORIZED',
        message: expect.stringMatching(/Unauthorized|required/i),
      });
    });

    it('should return 404 for unknown MCP', async () => {
      mockCreateUserMcpConfiguration.mockRejectedValue(new NotFoundError('MCP not found'));

      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/unknown-mcp/configuration',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: { fieldValues: { apiKey: 'key123' } },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('masked response', () => {
    it('should never return plaintext secrets in response', async () => {
      const response = await injectMcpConfigRequest({
        method: 'POST',
        url: '/mcps/gmail/configuration',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: {
          fieldValues: { apiKey: 'secret-key', refreshToken: 'secret-token' },
        },
      });

      const responseBody = JSON.stringify(response.json());
      expect(responseBody).not.toContain('secret-key');
      expect(responseBody).not.toContain('secret-token');
    });
  });

  describe('route handler', () => {
    it('should return masked configuration when handler succeeds', async () => {
      const result = await createMcpConfigurationRoute.handler({
        params: { mcpId: 'gmail' },
        body: VALID_BODY,
        query: {},
        headers: AUTH_HEADERS,
      });

      expect(result).toMatchObject({
        mcpId: 'gmail',
        status: 'configured',
      });
    });

    it('should reject invalid body via schema validation', () => {
      const validateBody = validatorFactory(createMcpConfigurationBodySchema);
      const parsed = validateBody({});

      expect(parsed.success).toBe(false);
    });
  });
});
