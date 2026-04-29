import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { useForgotPassword } from './useForgotPassword';

const hoisted = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock('../http/useHttpClient', () => ({
  useHttpClient: () => ({
    post: hoisted.post,
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }),
}));

describe('useForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose initial state with isLoading false and no data or error', () => {
    const { result } = renderHook(() => useForgotPassword());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should set isLoading true then false and set data without error when post resolves', async () => {
    let resolvePost: (value: { ok: boolean }) => void;
    const pending = new Promise<{ ok: boolean }>((resolve) => {
      resolvePost = resolve;
    });
    hoisted.post.mockImplementationOnce(() => pending);

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      void result.current.fetch({ body: { email: 'user@example.com' } });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      resolvePost!({ ok: true });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ ok: true });
      expect(result.current.error).toBeUndefined();
    });
  });

  it('should set isLoading true then false and set error without data when post rejects', async () => {
    const apiError = new CommonError(404, ErrorTypes.NOT_FOUND, 'User not found');
    let rejectPost: (reason: unknown) => void;
    const pending = new Promise<never>((_, reject) => {
      rejectPost = reject;
    });
    hoisted.post.mockImplementationOnce(() => pending);

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      void result.current.fetch({ body: { email: 'missing@example.com' } });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      rejectPost!(apiError);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(apiError);
    });
  });

  it('should allow a subsequent fetch after a failed fetch and replace error with success', async () => {
    hoisted.post
      .mockRejectedValueOnce(
        new CommonError(500, ErrorTypes.INTERNAL_ERROR, 'Temporary failure'),
      )
      .mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.fetch({ body: { email: 'user@example.com' } });
    });

    await waitFor(() => expect(result.current.error).toBeDefined());

    await act(async () => {
      await result.current.fetch({ body: { email: 'user@example.com' } });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ ok: true });
      expect(result.current.error).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should expose a CommonError instance when post rejects with a network-style failure', async () => {
    const networkError = new CommonError(
      0,
      ErrorTypes.INTERNAL_ERROR,
      'Network request failed',
    );
    hoisted.post.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.fetch({ body: { email: 'user@example.com' } });
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(CommonError);
      expect(result.current.error).toBe(networkError);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
