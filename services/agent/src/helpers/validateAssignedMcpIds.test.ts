import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, WrongParamError } from '@vassembly/errors';

const { mockGetMcpById, mockGetUserMcpConfigModel } = vi.hoisted(() => ({
  mockGetMcpById: vi.fn(),
  mockGetUserMcpConfigModel: vi.fn(),
}));

vi.mock('@vassembly/domain-mcp', () => ({
  default: {
    queries: {
      getById: mockGetMcpById,
    },
  },
}));

vi.mock('@vassembly/domain-user-mcp-config', () => ({
  default: {
    queries: {
      getUserMcpConfigModel: mockGetUserMcpConfigModel,
    },
  },
}));

import { validateAssignedMcpIds } from './validateAssignedMcpIds';

describe('validateAssignedMcpIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete when every mcpId exists in catalog and is configured for the user', async () => {
    mockGetMcpById.mockResolvedValue({ data: { id: 'mcp-1' } });
    mockGetUserMcpConfigModel.mockResolvedValue({ id: 'config-1', mcpId: 'mcp-1', enabled: true });

    await expect(
      validateAssignedMcpIds({ userId: 'user-1', assignedMcpIds: ['mcp-1'] }),
    ).resolves.toBeUndefined();
  });

  it('should throw NotFoundError when a catalog mcpId does not exist', async () => {
    mockGetMcpById.mockRejectedValue(new NotFoundError('MCP not found'));

    await expect(
      validateAssignedMcpIds({ userId: 'user-1', assignedMcpIds: ['mcp-missing'] }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw WrongParamError when an mcpId is not configured for the user', async () => {
    mockGetMcpById.mockResolvedValue({ data: { id: 'mcp-1' } });
    mockGetUserMcpConfigModel.mockResolvedValue(null);

    await expect(
      validateAssignedMcpIds({ userId: 'user-1', assignedMcpIds: ['mcp-1'] }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should throw WrongParamError when an mcpId is disabled for the user', async () => {
    mockGetMcpById.mockResolvedValue({ data: { id: 'mcp-1' } });
    mockGetUserMcpConfigModel.mockResolvedValue({ id: 'config-1', mcpId: 'mcp-1', enabled: false });

    await expect(
      validateAssignedMcpIds({ userId: 'user-1', assignedMcpIds: ['mcp-1'] }),
    ).rejects.toThrow(/disabled/i);
  });
});
