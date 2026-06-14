import { describe, it, expect, vi, beforeEach } from 'vitest';

import { UnauthorizedError, ValidationError } from '@vassembly/errors';
import type { Builder } from '@vassembly/graphql';

const {
  mockGetUserMcpConfiguration,
  mockListUserMcpConfigurations,
  mockListMcps,
} = vi.hoisted(() => ({
  mockGetUserMcpConfiguration: vi.fn(),
  mockListUserMcpConfigurations: vi.fn(),
  mockListMcps: vi.fn(),
}));

vi.mock('@vassembly/service-mcp', () => ({
  default: {
    listMcps: mockListMcps,
    getAvailableTags: vi.fn(),
    getUserMcpConfiguration: mockGetUserMcpConfiguration,
    listUserMcpConfigurations: mockListUserMcpConfigurations,
  },
}));

import { registerMcpResolvers } from '../../src/graphql/resolvers/mcp';

type McpConfigurationResolver = (
  root: unknown,
  args: { mcpId: string },
  context: { authenticatedUserId?: string },
) => Promise<{
  id: string;
  mcpId: string;
  status: string;
  createdAt: string;
} | null>;

type UserConfiguredMcpsResolver = (
  root: unknown,
  args: { limit?: number | null; offset?: number | null },
  context: { authenticatedUserId?: string },
) => Promise<{
  items: Array<{ mcpId: string; status?: string; configurationStatus?: string }>;
}>;

type McpsResolver = (
  root: unknown,
  args: { page?: number | null; size?: number | null; search?: string | null; tags?: string[] | null },
  context: { authenticatedUserId?: string },
) => Promise<{
  items: Array<{ id: string; configurationStatus?: string }>;
}>;

interface CapturedMcpConfigResolvers {
  resolveMcpConfiguration?: McpConfigurationResolver;
  resolveUserConfiguredMcps?: UserConfiguredMcpsResolver;
  resolveMcps?: McpsResolver;
}

const captureMcpConfigResolvers = (): CapturedMcpConfigResolvers => {
  const captured: CapturedMcpConfigResolvers = {};

  const arg = {
    int: (config: unknown) => config,
    string: (config: unknown) => config,
    id: (config: unknown) => config,
    stringList: (config: unknown) => config,
  };

  const builder = {
    queryFields: (fieldsFactory: (t: {
      field: (config: {
        resolve: McpConfigurationResolver | UserConfiguredMcpsResolver | McpsResolver;
        args?: Record<string, unknown>;
      }) => void;
      arg: typeof arg;
    }) => void) => {
      fieldsFactory({
        field: (config) => {
          if (config.args !== undefined && 'mcpId' in config.args && 'page' in config.args) {
            return;
          }

          if (config.args !== undefined && 'mcpId' in config.args) {
            captured.resolveMcpConfiguration = config.resolve as McpConfigurationResolver;
            return;
          }

          if (config.args !== undefined && ('limit' in config.args || 'offset' in config.args)) {
            captured.resolveUserConfiguredMcps = config.resolve as UserConfiguredMcpsResolver;
            return;
          }

          if (config.args !== undefined && 'page' in config.args) {
            captured.resolveMcps = config.resolve as McpsResolver;
          }
        },
        arg,
      });
    },
  } as unknown as Builder;

  registerMcpResolvers(builder);

  return captured;
};

const MOCK_CONFIGURATION = {
  id: 'config-1',
  userId: 'user-123',
  mcpId: 'mcp-gmail',
  status: 'configured',
  fieldValues: [{ key: 'apiKey', hasSecret: true }],
  createdAt: '2026-06-08T12:00:00.000Z',
  updatedAt: '2026-06-08T12:00:00.000Z',
};

describe('GraphQL: MCP Configuration Queries', () => {
  const mockContext = { authenticatedUserId: 'user-123' };

  describe('mcpConfiguration query', () => {
    let resolveMcpConfiguration: McpConfigurationResolver;

    beforeEach(() => {
      vi.clearAllMocks();
      const captured = captureMcpConfigResolvers();

      if (captured.resolveMcpConfiguration === undefined) {
        throw new Error('mcpConfiguration resolver was not registered');
      }

      resolveMcpConfiguration = captured.resolveMcpConfiguration;
    });

    it('should return user configuration for MCP when configured', async () => {
      mockGetUserMcpConfiguration.mockResolvedValue(MOCK_CONFIGURATION);

      const result = await resolveMcpConfiguration({}, { mcpId: 'mcp-gmail' }, mockContext);

      expect(result).toMatchObject({
        mcpId: 'mcp-gmail',
        status: 'configured',
      });
      expect(result?.id).toBeDefined();
      expect(result?.createdAt).toBeDefined();
    });

    it('should return null when MCP is not configured', async () => {
      mockGetUserMcpConfiguration.mockResolvedValue(null);

      const result = await resolveMcpConfiguration({}, { mcpId: 'mcp-unconfigured' }, mockContext);

      expect(result).toBeNull();
    });

    it('should throw UnauthorizedError when auth context is missing', async () => {
      await expect(resolveMcpConfiguration({}, { mcpId: 'mcp-gmail' }, {})).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should propagate service handler errors', async () => {
      mockGetUserMcpConfiguration.mockRejectedValue(new ValidationError('Invalid mcpId'));

      await expect(
        resolveMcpConfiguration({}, { mcpId: 'mcp-gmail' }, mockContext),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('userConfiguredMcps query', () => {
    let resolveUserConfiguredMcps: UserConfiguredMcpsResolver;

    beforeEach(() => {
      vi.clearAllMocks();
      const captured = captureMcpConfigResolvers();

      if (captured.resolveUserConfiguredMcps === undefined) {
        throw new Error('userConfiguredMcps resolver was not registered');
      }

      resolveUserConfiguredMcps = captured.resolveUserConfiguredMcps;
    });

    it('should return list of user configured MCPs', async () => {
      mockListUserMcpConfigurations.mockResolvedValue([
        { ...MOCK_CONFIGURATION, mcpId: 'mcp-gmail' },
        { ...MOCK_CONFIGURATION, id: 'config-2', mcpId: 'mcp-brave' },
      ]);

      const result = await resolveUserConfiguredMcps({}, {}, mockContext);

      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]?.mcpId).toBeDefined();
    });

    it('should return empty list when user has no configurations', async () => {
      mockListUserMcpConfigurations.mockResolvedValue([]);

      const result = await resolveUserConfiguredMcps(
        {},
        {},
        { authenticatedUserId: 'user-no-configs' },
      );

      expect(result.items).toEqual([]);
    });

    it('should support pagination via limit and offset', async () => {
      mockListUserMcpConfigurations.mockResolvedValue([
        { ...MOCK_CONFIGURATION, mcpId: 'mcp-gmail' },
      ]);

      const result = await resolveUserConfiguredMcps({}, { limit: 5, offset: 0 }, mockContext);

      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should throw UnauthorizedError when auth context is missing', async () => {
      await expect(resolveUserConfiguredMcps({}, {}, {})).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('Mcp.configurationStatus field', () => {
    let resolveMcps: McpsResolver;

    beforeEach(() => {
      vi.clearAllMocks();
      const captured = captureMcpConfigResolvers();

      if (captured.resolveMcps === undefined) {
        throw new Error('mcps resolver was not registered');
      }

      resolveMcps = captured.resolveMcps;
    });

    it('should expose configurationStatus on MCP list items', async () => {
      mockListMcps.mockResolvedValue({
        items: [
          { id: 'mcp-gmail', configurationStatus: 'configured' },
          { id: 'mcp-brave', configurationStatus: 'pending' },
        ],
        totalCount: 2,
        page: 0,
        size: 20,
      });

      const result = await resolveMcps({}, { page: 0, size: 20 }, mockContext);
      const statuses = result.items.map((item) => item.configurationStatus);

      expect(statuses).toContain('configured');
      expect(statuses).toContain('pending');
    });
  });
});
