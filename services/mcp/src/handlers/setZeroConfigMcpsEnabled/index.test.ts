import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { McpListItemResponse } from '@vassembly/domain-mcp';
import { InternalError, UnauthorizedError } from '@vassembly/errors';

import type { ServiceContext } from '../../types';

const { mockGetList, mockSetUserMcpEnabled, mockGetMcpUserStatuses } = vi.hoisted(() => ({
  mockGetList: vi.fn(),
  mockSetUserMcpEnabled: vi.fn(),
  mockGetMcpUserStatuses: vi.fn(),
}));

vi.mock('@vassembly/domain-mcp', () => ({
  default: {
    commands: {},
    queries: {
      getList: mockGetList,
    },
  },
  MAX_PAGE_SIZE: 50,
}));

vi.mock('@vassembly/domain-user-mcp-config', () => ({
  userMcpConfigDomain: {
    commands: {
      setUserMcpEnabled: mockSetUserMcpEnabled,
    },
    queries: {
      getMcpUserStatuses: mockGetMcpUserStatuses,
    },
  },
  mcpRequiresConfiguration: ({ schema }: { schema?: { fields?: unknown[] } | null }) =>
    (schema?.fields?.length ?? 0) > 0,
}));

import { setZeroConfigMcpsEnabled } from './index';

const buildContext = (): ServiceContext => ({
  userId: 'user-1',
});

const buildMcpItem = (overrides: Partial<McpListItemResponse> = {}): McpListItemResponse => ({
  id: 'mcp-zero',
  slug: 'zero-config-mcp',
  name: 'Zero Config MCP',
  description: 'No setup required',
  tags: ['tools'],
  iconPath: '/mcps/zero.svg',
  documentationUrl: null,
  repositoryUrl: null,
  configSchema: { fields: [] },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

describe('setZeroConfigMcpsEnabled handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetUserMcpEnabled.mockResolvedValue({});
    mockGetMcpUserStatuses.mockResolvedValue({});
  });

  it('should throw UnauthorizedError when userId is missing', async () => {
    await expect(
      setZeroConfigMcpsEnabled({ enabled: true }, { userId: '' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should enable only zero-config MCPs when enabled is true', async () => {
    const zeroConfigMcp = buildMcpItem({ id: 'mcp-zero-1' });
    const configurableMcp = buildMcpItem({
      id: 'mcp-config-1',
      slug: 'github',
      name: 'GitHub MCP',
      configSchema: {
        fields: [{ key: 'token', label: 'Token', type: 'password' }],
      },
    });

    mockGetList.mockResolvedValue({
      items: [zeroConfigMcp, configurableMcp],
      total: 2,
      page: 0,
      size: 50,
    });

    const result = await setZeroConfigMcpsEnabled({ enabled: true }, buildContext());

    expect(result).toEqual({
      enabled: true,
      mcpIds: ['mcp-zero-1'],
      updatedCount: 1,
    });
    expect(mockSetUserMcpEnabled).toHaveBeenCalledTimes(1);
    expect(mockSetUserMcpEnabled).toHaveBeenCalledWith({
      userId: 'user-1',
      mcpId: 'mcp-zero-1',
      enabled: true,
      schema: { fields: [] },
    });
  });

  it('should disable only zero-config MCPs when enabled is false', async () => {
    const zeroConfigMcp = buildMcpItem({ id: 'mcp-zero-2' });

    mockGetList.mockResolvedValue({
      items: [zeroConfigMcp],
      total: 1,
      page: 0,
      size: 50,
    });
    mockGetMcpUserStatuses.mockResolvedValue({
      'mcp-zero-2': { configurationStatus: 'configured', enabled: true },
    });

    const result = await setZeroConfigMcpsEnabled({ enabled: false }, buildContext());

    expect(result).toEqual({
      enabled: false,
      mcpIds: ['mcp-zero-2'],
      updatedCount: 1,
    });
    expect(mockGetMcpUserStatuses).toHaveBeenCalledWith({
      userId: 'user-1',
      mcpIds: ['mcp-zero-2'],
    });
    expect(mockSetUserMcpEnabled).toHaveBeenCalledWith({
      userId: 'user-1',
      mcpId: 'mcp-zero-2',
      enabled: false,
      schema: { fields: [] },
    });
  });

  it('should not call setUserMcpEnabled when disabling MCPs without enabled configs', async () => {
    const zeroConfigMcp = buildMcpItem({ id: 'mcp-zero-3' });

    mockGetList.mockResolvedValue({
      items: [zeroConfigMcp],
      total: 1,
      page: 0,
      size: 50,
    });
    mockGetMcpUserStatuses.mockResolvedValue({
      'mcp-zero-3': { configurationStatus: 'pending', enabled: false },
    });

    const result = await setZeroConfigMcpsEnabled({ enabled: false }, buildContext());

    expect(result).toEqual({
      enabled: false,
      mcpIds: ['mcp-zero-3'],
      updatedCount: 0,
    });
    expect(mockSetUserMcpEnabled).not.toHaveBeenCalled();
  });

  it('should return updatedCount 0 when catalog has no zero-config MCPs', async () => {
    mockGetList.mockResolvedValue({
      items: [
        buildMcpItem({
          id: 'mcp-config-only',
          configSchema: {
            fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }],
          },
        }),
      ],
      total: 1,
      page: 0,
      size: 50,
    });

    const result = await setZeroConfigMcpsEnabled({ enabled: true }, buildContext());

    expect(result).toEqual({
      enabled: true,
      mcpIds: [],
      updatedCount: 0,
    });
    expect(mockSetUserMcpEnabled).not.toHaveBeenCalled();
  });

  it('should paginate through the full catalog when total exceeds page size', async () => {
    const pageZeroItem = buildMcpItem({ id: 'mcp-page-0' });
    const pageOneItem = buildMcpItem({ id: 'mcp-page-1', slug: 'second-zero' });

    mockGetList
      .mockResolvedValueOnce({
        items: [pageZeroItem],
        total: 2,
        page: 0,
        size: 1,
      })
      .mockResolvedValueOnce({
        items: [pageOneItem],
        total: 2,
        page: 1,
        size: 1,
      });

    const result = await setZeroConfigMcpsEnabled({ enabled: true }, buildContext());

    expect(mockGetList).toHaveBeenCalledTimes(2);
    expect(mockGetList).toHaveBeenNthCalledWith(1, { page: 0, size: 50 });
    expect(mockGetList).toHaveBeenNthCalledWith(2, { page: 1, size: 50 });
    expect(result.updatedCount).toBe(2);
    expect(mockSetUserMcpEnabled).toHaveBeenCalledTimes(2);
  });

  it('should treat MCPs without configSchema as zero-config', async () => {
    const noSchemaMcp = buildMcpItem({
      id: 'mcp-no-schema',
      configSchema: undefined,
    });

    mockGetList.mockResolvedValue({
      items: [noSchemaMcp],
      total: 1,
      page: 0,
      size: 50,
    });

    await setZeroConfigMcpsEnabled({ enabled: true }, buildContext());

    expect(mockSetUserMcpEnabled).toHaveBeenCalledWith({
      userId: 'user-1',
      mcpId: 'mcp-no-schema',
      enabled: true,
      schema: { fields: [] },
    });
  });

  it('should fail fast when an individual setUserMcpEnabled call rejects', async () => {
    mockGetList.mockResolvedValue({
      items: [buildMcpItem({ id: 'mcp-zero-fail' })],
      total: 1,
      page: 0,
      size: 50,
    });
    mockSetUserMcpEnabled.mockRejectedValue(new InternalError('Enable failed'));

    await expect(setZeroConfigMcpsEnabled({ enabled: true }, buildContext())).rejects.toThrow(
      InternalError,
    );
  });
});
