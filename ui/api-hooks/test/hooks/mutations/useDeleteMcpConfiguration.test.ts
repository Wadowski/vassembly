import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@vassembly/errors';

import { useDeleteMcpConfiguration } from '../../../src/mcps/useDeleteMcpConfiguration';

const hoisted = vi.hoisted(() => ({
  deleteRequest: vi.fn(),
}));

vi.mock('../../../src/http/useHttpClient', () => ({
  useHttpClient: () => ({
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: hoisted.deleteRequest,
    get: vi.fn(),
  }),
}));

describe('useDeleteMcpConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('delete mutation', () => {
    it('should delete configuration and return success', async () => {
      hoisted.deleteRequest.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDeleteMcpConfiguration());
      const [deleteConfig] = result.current;

      let deleteResult: { success: boolean } | undefined;
      await act(async () => {
        deleteResult = await deleteConfig({ mcpId: 'mcp-gmail' });
      });

      expect(deleteResult?.success).toBe(true);
    });

    it('should handle not found gracefully with idempotent success', async () => {
      hoisted.deleteRequest.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDeleteMcpConfiguration());
      const [deleteConfig] = result.current;

      let deleteResult: { success: boolean } | undefined;
      await act(async () => {
        deleteResult = await deleteConfig({ mcpId: 'mcp-nonexistent' });
      });

      expect(deleteResult?.success).toBe(true);
    });

    it('should handle 401 unauthorized gracefully', async () => {
      hoisted.deleteRequest.mockRejectedValue(new UnauthorizedError('Authentication required'));

      const { result } = renderHook(() => useDeleteMcpConfiguration());
      const [deleteConfig] = result.current;

      let deleteResult: unknown;
      await act(async () => {
        deleteResult = await deleteConfig({ mcpId: 'mcp-gmail' });
      });

      expect(deleteResult).toBeUndefined();
      expect(result.current[1].error).toBeDefined();
    });
  });
});
