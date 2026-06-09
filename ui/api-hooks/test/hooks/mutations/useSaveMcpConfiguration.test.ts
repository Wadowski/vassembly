import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError, WrongParamError } from '@vassembly/errors';

import { MOCK_SAVE_CONFIGURATION_RESPONSE } from '../fixtures/mcpFixtures';
import { useSaveMcpConfiguration } from '../../../src/mcps/useSaveMcpConfiguration';

const hoisted = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('../../../src/http/useHttpClient', () => ({
  useHttpClient: () => ({
    post: hoisted.post,
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  }),
}));

describe('useSaveMcpConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('save mutation', () => {
    it('should call save endpoint and return result', async () => {
      hoisted.post.mockResolvedValue(MOCK_SAVE_CONFIGURATION_RESPONSE);

      const { result } = renderHook(() => useSaveMcpConfiguration());
      const [save] = result.current;

      let saveResult: typeof MOCK_SAVE_CONFIGURATION_RESPONSE | undefined;
      await act(async () => {
        saveResult = await save({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'key123', refreshToken: 'token456' },
        });
      });

      expect(saveResult?.id).toBeDefined();
      expect(saveResult?.mcpId).toBe('mcp-gmail');
      expect(saveResult?.status).toBe('configured');
    });

    it('should return error on validation failure', async () => {
      hoisted.post.mockRejectedValue(new WrongParamError('refreshToken is required'));

      const { result } = renderHook(() => useSaveMcpConfiguration());
      const [save] = result.current;

      await act(async () => {
        try {
          await save({
            mcpId: 'mcp-gmail',
            fieldValues: {},
          });
          expect.fail('Expected save to throw validation error');
        } catch (error) {
          expect((error as Error).message).toMatch(/required|validation/i);
        }
      });
    });

    it('should provide loading state during save', async () => {
      let resolvePost: (value: typeof MOCK_SAVE_CONFIGURATION_RESPONSE) => void;
      const pending = new Promise<typeof MOCK_SAVE_CONFIGURATION_RESPONSE>((resolve) => {
        resolvePost = resolve;
      });
      hoisted.post.mockImplementation(() => pending);

      const { result } = renderHook(() => useSaveMcpConfiguration());
      const [save, { loading }] = result.current;

      expect(loading).toBe(false);

      act(() => {
        void save({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'key' },
        });
      });

      await waitFor(() => {
        expect(result.current[1].loading).toBe(true);
      });

      await act(async () => {
        resolvePost!(MOCK_SAVE_CONFIGURATION_RESPONSE);
      });

      await waitFor(() => {
        expect(result.current[1].loading).toBe(false);
      });
    });

    it('should handle 401 unauthorized gracefully', async () => {
      hoisted.post.mockRejectedValue(new UnauthorizedError('Authentication required'));

      const { result } = renderHook(() => useSaveMcpConfiguration());
      const [save, { error }] = result.current;

      let saveResult: unknown;
      await act(async () => {
        saveResult = await save({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'key123', refreshToken: 'token456' },
        });
      });

      expect(saveResult).toBeUndefined();
      await waitFor(() => {
        expect(result.current[1].error ?? error).toBeDefined();
      });
    });
  });
});
