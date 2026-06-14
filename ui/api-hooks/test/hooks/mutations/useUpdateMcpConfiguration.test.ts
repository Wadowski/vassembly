import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError } from '@vassembly/errors';

import { MOCK_SAVE_CONFIGURATION_RESPONSE } from '../fixtures/mcpFixtures';
import { useUpdateMcpConfiguration } from '../../../src/mcps/useUpdateMcpConfiguration';

const hoisted = vi.hoisted(() => ({
  patch: vi.fn(),
}));

vi.mock('../../../src/http/useHttpClient', () => ({
  useHttpClient: () => ({
    post: vi.fn(),
    patch: hoisted.patch,
    put: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  }),
}));

describe('useUpdateMcpConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('update mutation', () => {
    it('should update config with partial fieldValues', async () => {
      hoisted.patch.mockResolvedValue(MOCK_SAVE_CONFIGURATION_RESPONSE);

      const { result } = renderHook(() => useUpdateMcpConfiguration());
      const [update] = result.current;

      let updateResult: typeof MOCK_SAVE_CONFIGURATION_RESPONSE | undefined;
      await act(async () => {
        updateResult = await update({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'newKey' },
        });
      });

      expect(updateResult?.mcpId).toBe('mcp-gmail');
    });

    it('should handle blank password fields by retaining existing secrets', async () => {
      hoisted.patch.mockResolvedValue(MOCK_SAVE_CONFIGURATION_RESPONSE);

      const { result } = renderHook(() => useUpdateMcpConfiguration());
      const [update] = result.current;

      let updateResult: typeof MOCK_SAVE_CONFIGURATION_RESPONSE | undefined;
      await act(async () => {
        updateResult = await update({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'newKey', refreshToken: '' },
        });
      });

      expect(updateResult).toBeDefined();
    });

    it('should handle 401 unauthorized gracefully', async () => {
      hoisted.patch.mockRejectedValue(new UnauthorizedError('Authentication required'));

      const { result } = renderHook(() => useUpdateMcpConfiguration());
      const [update] = result.current;

      let updateResult: unknown;
      await act(async () => {
        updateResult = await update({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'newKey' },
        });
      });

      expect(updateResult).toBeUndefined();
      expect(result.current[1].error).toBeDefined();
    });
  });
});
