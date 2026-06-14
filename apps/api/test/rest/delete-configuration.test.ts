import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError, UnauthorizedError } from '@vassembly/errors';

const AUTH_HEADERS = {
  authorization: 'Bearer valid-jwt-token-user-123',
};

const { mockAuthorize, mockDeleteUserMcpConfiguration } = vi.hoisted(() => ({
  mockAuthorize: vi.fn(),
  mockDeleteUserMcpConfiguration: vi.fn(),
}));

vi.mock('@vassembly/service-auth', () => ({
  handlers: {
    authorizeRequest: mockAuthorize,
  },
}));

vi.mock('@vassembly/service-mcp', () => ({
  default: {
    deleteUserMcpConfiguration: mockDeleteUserMcpConfiguration,
  },
}));

import { deleteMcpConfigurationRoute } from '../../src/routes/mcps/deleteConfiguration';
import { mcpConfigurationRoutes } from '../../src/routes/mcps/index';
import { injectMcpConfigRequest } from '../rest-test-utils';

describe('REST: DELETE /mcps/:mcpId/configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthorize.mockResolvedValue({ userId: 'user-123' });
    mockDeleteUserMcpConfiguration.mockResolvedValue({ success: true });
  });

  describe('deletion', () => {
    it('should delete configuration and return 200', async () => {
      const response = await injectMcpConfigRequest({
        method: 'DELETE',
        url: '/mcps/gmail/configuration',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        success: true,
      });
    });

    it('should return 401 when unauthorized', async () => {
      mockAuthorize.mockRejectedValue(new UnauthorizedError('Unauthorized'));

      const response = await injectMcpConfigRequest({
        method: 'DELETE',
        url: '/mcps/gmail/configuration',
        routes: mcpConfigurationRoutes,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when configuration is not found', async () => {
      mockDeleteUserMcpConfiguration.mockRejectedValue(new NotFoundError('Configuration not found'));

      const response = await injectMcpConfigRequest({
        method: 'DELETE',
        url: '/mcps/unconfigured/configuration',
        routes: mcpConfigurationRoutes,
        headers: AUTH_HEADERS,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('route handler', () => {
    it('should return success when handler succeeds', async () => {
      const result = await deleteMcpConfigurationRoute.handler({
        params: { mcpId: 'gmail' },
        body: undefined,
        query: {},
        headers: AUTH_HEADERS,
      });

      expect(result).toMatchObject({
        success: true,
      });
    });
  });
});
