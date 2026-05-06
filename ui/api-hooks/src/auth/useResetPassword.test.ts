import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { useResetPassword } from './useResetPassword';

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

const successUser = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
  },
};

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should expose initial state with isPending false and no data or error', () => {
    const { result } = renderHook(() => useResetPassword());

    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should set isPending true then false and set data when post resolves with valid token and password', async () => {
    let resolvePost: (value: typeof successUser) => void;
    const pending = new Promise<typeof successUser>((resolve) => {
      resolvePost = resolve;
    });
    hoisted.post.mockImplementationOnce(() => pending);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      void result.current.mutate({ token: 'valid-token', password: 'NewPassword1' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      resolvePost!(successUser);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toEqual(successUser);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('should set error and not call post when token is missing', async () => {
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await result.current.mutate({ token: '', password: 'NewPassword1' });
    });

    expect(hoisted.post).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(CommonError);
      expect(result.current.error?.type).toBe(ErrorTypes.WRONG_PARAM);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should set error and not call post when password is empty', async () => {
    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await result.current.mutate({ token: 'valid-token', password: '' });
    });

    expect(hoisted.post).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(CommonError);
      expect(result.current.error?.type).toBe(ErrorTypes.WRONG_PARAM);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isPending).toBe(false);
    });
  });

  it('should set isPending false and set error when post rejects for invalid token', async () => {
    const apiError = new CommonError(404, ErrorTypes.NOT_FOUND, 'Reset token not found');
    let rejectPost: (reason: unknown) => void;
    const pending = new Promise<never>((_, reject) => {
      rejectPost = reject;
    });
    hoisted.post.mockImplementationOnce(() => pending);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      void result.current.mutate({ token: 'expired-token', password: 'NewPassword1' });
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      rejectPost!(apiError);
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(apiError);
    });
  });

  it('should expose a CommonError when post rejects with a network-style failure', async () => {
    const networkError = new CommonError(
      0,
      ErrorTypes.INTERNAL_ERROR,
      'Network request failed',
    );
    hoisted.post.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await result.current.mutate({ token: 'valid-token', password: 'NewPassword1' });
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(CommonError);
      expect(result.current.error).toBe(networkError);
      expect(result.current.data).toBeUndefined();
      expect(result.current.isPending).toBe(false);
    });
  });
});
