import type { FormEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { useLoginForm } from './useLoginForm';

const h = vi.hoisted(() => {
  return {
    login: {
      data: undefined as
        | {
            authToken: string;
            refreshToken: string;
            user: { id: string; email: string; firstName?: string; lastName?: string };
          }
        | undefined,
      error: undefined as CommonError | undefined,
      isLoading: false,
      fetch: vi.fn(),
    },
    setSession: vi.fn(),
    show: vi.fn(),
  };
});

vi.mock('@vassembly/ui-api-hooks', () => ({
  useLogin: () => h.login,
}));

vi.mock('@vassembly/ui-user-auth', () => ({
  useUserAuth: () => ({ setSession: h.setSession }),
}));

vi.mock('@vassembly/ui-system-design/snackbar', () => ({
  useSnackbar: () => ({ show: h.show }),
}));

const mockOrigin = 'https://app.example.com';

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.login.data = undefined;
    h.login.error = undefined;
    h.login.isLoading = false;
    h.login.fetch = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, origin: mockOrigin, href: `${mockOrigin}/` },
    });
  });

  it('should initialize with empty email and password', () => {
    const { result } = renderHook(() => useLoginForm({}));
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
  });

  it('should update email when handleEmailChange is called with a new value', () => {
    const { result } = renderHook(() => useLoginForm({}));
    act(() => {
      result.current.handleEmailChange('test@example.com');
    });
    expect(result.current.email).toBe('test@example.com');
  });

  it('should update password when handlePasswordChange is called with a new value', () => {
    const { result } = renderHook(() => useLoginForm({}));
    act(() => {
      result.current.handlePasswordChange('password123');
    });
    expect(result.current.password).toBe('password123');
  });

  it('should call login fetch with body email and password when the form is valid', async () => {
    h.login.fetch = vi.fn(async () => {
      h.login.data = {
        authToken: 'a',
        refreshToken: 'r',
        user: { id: '1', email: 'x@x.com' },
      };
    });
    const { result, rerender } = renderHook(() => useLoginForm({ fallbackPath: '/' }));
    act(() => {
      result.current.handleEmailChange('x@x.com');
      result.current.handlePasswordChange('pass');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.login.fetch).toHaveBeenCalledWith({
      body: { email: 'x@x.com', password: 'pass' },
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.setSession).toHaveBeenCalled();
    });
  });

  it('should call setSession with authenticated user and status after a successful response', async () => {
    h.login.fetch = vi.fn(async () => {
      h.login.data = {
        authToken: 'tok',
        refreshToken: 'ref',
        user: { id: 'u1', email: 'a@a.com' },
      };
    });
    const { result, rerender } = renderHook(() => useLoginForm({ fallbackPath: '/' }));
    act(() => {
      result.current.handleEmailChange('a@a.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.setSession).toHaveBeenCalledWith({
        user: { id: 'u1', email: 'a@a.com' },
        status: 'authenticated',
      });
    });
  });

  it('should call onRedirect with the resolved path after a successful response', async () => {
    const onRedirect = vi.fn();
    h.login.fetch = vi.fn(async () => {
      h.login.data = {
        authToken: 't',
        refreshToken: 'r',
        user: { id: '1', email: 'u@e.com' },
      };
    });
    const { result, rerender } = renderHook(() =>
      useLoginForm({ returnUrl: '/next', fallbackPath: '/', onRedirect }),
    );
    act(() => {
      result.current.handleEmailChange('u@e.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(onRedirect).toHaveBeenCalledWith('/next');
    });
  });

  it('should show a snackbar and not call login fetch when the email is empty', async () => {
    h.login.fetch = vi.fn();
    const { result } = renderHook(() => useLoginForm({}));
    act(() => {
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.show).toHaveBeenCalled();
    expect(h.login.fetch).not.toHaveBeenCalled();
  });

  it('should show a snackbar and not call login fetch when the email is invalid', async () => {
    h.login.fetch = vi.fn();
    const { result } = renderHook(() => useLoginForm({}));
    act(() => {
      result.current.handleEmailChange('bad');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.show).toHaveBeenCalled();
    expect(h.login.fetch).not.toHaveBeenCalled();
  });

  it('should show a snackbar and not call login fetch when the password is empty', async () => {
    h.login.fetch = vi.fn();
    const { result } = renderHook(() => useLoginForm({}));
    act(() => {
      result.current.handleEmailChange('a@a.com');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.show).toHaveBeenCalled();
    expect(h.login.fetch).not.toHaveBeenCalled();
  });

  it('should not call fetch while the login request is still loading', async () => {
    h.login.isLoading = true;
    h.login.fetch = vi.fn();
    const { result } = renderHook(() => useLoginForm({}));
    act(() => {
      result.current.handleEmailChange('a@a.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.login.fetch).not.toHaveBeenCalled();
  });

  it('should show a snackbar with a user-safe message when login returns an error', async () => {
    h.login.fetch = vi.fn(async () => {
      h.login.error = new CommonError(401, ErrorTypes.UNAUTHORIZED, 'Invalid credentials');
    });
    const { result, rerender } = renderHook(() => useLoginForm({}));
    act(() => {
      result.current.handleEmailChange('a@a.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.show).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Sign-in failed. Check your email and password.',
          variant: 'error',
        }),
      );
    });
  });

  it('should not call setSession when login returns an error', async () => {
    h.login.fetch = vi.fn(async () => {
      h.login.error = new CommonError(401, ErrorTypes.UNAUTHORIZED, 'nope');
    });
    const { result, rerender } = renderHook(() => useLoginForm({}));
    act(() => {
      result.current.handleEmailChange('a@a.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.show).toHaveBeenCalled();
    });
    expect(h.setSession).not.toHaveBeenCalled();
  });

  it('should not call onRedirect when login returns an error', async () => {
    const onRedirect = vi.fn();
    h.login.fetch = vi.fn(async () => {
      h.login.error = new CommonError(401, ErrorTypes.UNAUTHORIZED, 'nope');
    });
    const { result, rerender } = renderHook(() => useLoginForm({ onRedirect }));
    act(() => {
      result.current.handleEmailChange('a@a.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.show).toHaveBeenCalled();
    });
    expect(onRedirect).not.toHaveBeenCalled();
  });

  it('should call onSuccess with tokens and user after a successful response', async () => {
    const onSuccess = vi.fn();
    h.login.fetch = vi.fn(async () => {
      h.login.data = {
        authToken: 't1',
        refreshToken: 'r1',
        user: { id: '1', email: 'u@u.com' },
      };
    });
    const { result, rerender } = renderHook(() => useLoginForm({ onSuccess, fallbackPath: '/' }));
    act(() => {
      result.current.handleEmailChange('u@u.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        authToken: 't1',
        refreshToken: 'r1',
        user: { id: '1', email: 'u@u.com' },
      });
    });
  });

  it('should run onSuccess before onRedirect on success', async () => {
    const order: string[] = [];
    h.login.data = {
      authToken: 'a',
      refreshToken: 'b',
      user: { id: '1', email: 'u@u.com' },
    };
    h.login.fetch = vi.fn(async () => {
      h.login.data = {
        authToken: 'a',
        refreshToken: 'b',
        user: { id: '1', email: 'u@u.com' },
      };
    });
    const { result, rerender } = renderHook(() =>
      useLoginForm({
        onSuccess: () => {
          order.push('onSuccess');
        },
        onRedirect: () => {
          order.push('onRedirect');
        },
        fallbackPath: '/',
      }),
    );
    act(() => {
      result.current.handleEmailChange('u@u.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(order).toEqual(['onSuccess', 'onRedirect']);
    });
  });

  it('should pass returnUrl and fallback into redirect resolution for the success path', async () => {
    const onRedirect = vi.fn();
    h.login.fetch = vi.fn(async () => {
      h.login.data = {
        authToken: 'a',
        refreshToken: 'b',
        user: { id: '1', email: 'u@u.com' },
      };
    });
    const { result, rerender } = renderHook(() =>
      useLoginForm({ returnUrl: '/dash', fallbackPath: '/default', onRedirect }),
    );
    act(() => {
      result.current.handleEmailChange('u@u.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(onRedirect).toHaveBeenCalledWith('/dash');
    });
  });

  it('should redirect to the safe fallback when returnUrl is an open redirect to another site', async () => {
    const onRedirect = vi.fn();
    h.login.fetch = vi.fn(async () => {
      h.login.data = {
        authToken: 'a',
        refreshToken: 'b',
        user: { id: '1', email: 'u@u.com' },
      };
    });
    const { result, rerender } = renderHook(() =>
      useLoginForm({ returnUrl: 'https://evil.com/h', fallbackPath: '/safe', onRedirect }),
    );
    act(() => {
      result.current.handleEmailChange('u@u.com');
      result.current.handlePasswordChange('p');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(onRedirect).toHaveBeenCalledWith('/safe');
    });
  });

  it('should complete a full sign-in path from field updates through redirect', async () => {
    const onRedirect = vi.fn();
    h.login.fetch = vi.fn(async () => {
      h.login.data = {
        authToken: 'a',
        refreshToken: 'b',
        user: { id: '1', email: 'flow@e.com' },
      };
    });
    const { result, rerender } = renderHook(() =>
      useLoginForm({ returnUrl: '/done', fallbackPath: '/', onRedirect }),
    );
    act(() => {
      result.current.handleEmailChange('flow@e.com');
    });
    act(() => {
      result.current.handlePasswordChange('s3cret');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.login.fetch).toHaveBeenCalledWith({
      body: { email: 'flow@e.com', password: 's3cret' },
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.setSession).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(onRedirect).toHaveBeenCalledWith('/done');
    });
  });
});
