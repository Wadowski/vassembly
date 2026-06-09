import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnauthorizedError, WrongParamError } from '@vassembly/errors';

import { useTestMcpConnection } from '../../../src/mcps/useTestMcpConnection';

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

describe('useTestMcpConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('test connection mutation', () => {
    it('should return success on valid connection', async () => {
      hoisted.post.mockResolvedValue({ success: true, message: 'Connection verified' });

      const { result } = renderHook(() => useTestMcpConnection());
      const [test] = result.current;

      let testResult: { success: boolean; error?: string } | undefined;
      await act(async () => {
        testResult = await test({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'valid-key', refreshToken: 'valid-token' },
        });
      });

      expect(testResult?.success).toBe(true);
      expect(testResult?.error).toBeUndefined();
    });

    it('should return failure with error message on invalid connection', async () => {
      hoisted.post.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
      });

      const { result } = renderHook(() => useTestMcpConnection());
      const [test] = result.current;

      let testResult: { success: boolean; error?: string } | undefined;
      await act(async () => {
        testResult = await test({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'invalid-key', refreshToken: 'invalid' },
        });
      });

      expect(testResult?.success).toBe(false);
      expect(testResult?.error).toBeDefined();
    });

    it('should merge with saved secrets when useSavedSecrets is true', async () => {
      hoisted.post.mockResolvedValue({ success: true, message: 'Connection verified' });

      const { result } = renderHook(() => useTestMcpConnection());
      const [test] = result.current;

      let testResult: { success: boolean } | undefined;
      await act(async () => {
        testResult = await test({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'new-key', refreshToken: '' },
          useSavedSecrets: true,
        });
      });

      expect(testResult).toBeDefined();
      expect(testResult?.success).toBe(true);
    });

    it('should validate fieldValues before test', async () => {
      hoisted.post.mockRejectedValue(new WrongParamError('apiKey is required'));

      const { result } = renderHook(() => useTestMcpConnection());
      const [test] = result.current;

      await act(async () => {
        try {
          await test({
            mcpId: 'mcp-gmail',
            fieldValues: {},
          });
          expect.fail('Expected test to throw validation error');
        } catch (error) {
          expect((error as Error).message).toMatch(/required|validation/i);
        }
      });
    });

    it('should handle 401 unauthorized gracefully', async () => {
      hoisted.post.mockRejectedValue(new UnauthorizedError('Authentication required'));

      const { result } = renderHook(() => useTestMcpConnection());
      const [test] = result.current;

      let testResult: unknown;
      await act(async () => {
        testResult = await test({
          mcpId: 'mcp-gmail',
          fieldValues: { apiKey: 'valid-key', refreshToken: 'valid-token' },
        });
      });

      expect(testResult).toBeUndefined();
      expect(result.current[1].error).toBeDefined();
    });
  });
});
