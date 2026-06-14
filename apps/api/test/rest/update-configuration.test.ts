import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

const MOCK_UPDATED_CONFIGURATION = {
  id: 'config-gmail-1',
  userId: 'user-123',
  mcpId: 'gmail',
  status: 'configured',
  fieldValues: [{ key: 'apiKey', hasSecret: true }],
  createdAt: '2026-06-08T12:00:00.000Z',
  updatedAt: '2026-06-08T13:00:00.000Z',
};

const AUTH_HEADERS = {
  authorization: 'Bearer valid-jwt-token-user-123',
};

const { mockAuthorize, mockUpdateUserMcpConfiguration } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockUpdateUserMcpConfiguration: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-mcp', () => ({
  default: {
    updateUserMcpConfiguration: mockUpdateUserMcpConfiguration,
  },
}));

import { updateMcpConfigurationRoute } from '../../src/routes/mcps/updateConfiguration';
import { mcpConfigurationRoutes } from '../../src/routes/mcps/index';
import { injectMcpConfigRequest } from '../rest-test-utils';

describe('REST: PATCH /mcps/:mcpId/configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue({ userId: 'user-123' });
    mockUpdateUserMcpConfiguration.mockResolvedValue(MOCK_UPDATED_CONFIGURATION);
  });

  describe('update', () => {
    it('should update configuration and return 200', async () => {
      const response = await injectMcpConfigRequest({
        method: 'PATCH',
        url: '/mcps/gmail/configuration',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: {
          fieldValues: { apiKey: 'new-key', refreshToken: '' },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        mcpId: 'gmail',
      });
    });

    it('should return 404 when configuration is not found', async () => {
      mockUpdateUserMcpConfiguration.mockRejectedValue(new NotFoundError('Configuration not found'));

      const response = await injectMcpConfigRequest({
        method: 'PATCH',
        url: '/mcps/unconfigured-mcp/configuration',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
        payload: { fieldValues: { apiKey: 'key' } },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when unauthorized', async () => {
      mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

      const response = await injectMcpConfigRequest({
        method: 'PATCH',
        url: '/mcps/gmail/configuration',
        routes: mcpConfigurationRoutes,
        payload: { fieldValues: { apiKey: 'key' } },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('route handler', () => {
    it('should return updated configuration when handler succeeds', async () => {
      const result = await updateMcpConfigurationRoute.handler({
        params: { mcpId: 'gmail' },
        body: { fieldValues: { apiKey: 'new-key' } },
        query: {},
        headers: AUTH_HEADERS,
      });

      expect(result).toMatchObject({
        mcpId: 'gmail',
      });
    });
  });
});
