import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { useRegisterFormCompletionEffect } from './useRegisterFormCompletionEffect';

const show = vi.fn();
const dismiss = vi.fn();
const setSession = vi.fn();
const onRedirect = vi.fn();
const onSuccess = vi.fn();

describe('useRegisterFormCompletionEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...window.location,
        origin: 'https://app.example.com',
        href: 'https://app.example.com/',
      },
    });
  });

  it('should not complete or show notifications while register is still loading', () => {
    const completionPendingRef = { current: true };
    renderHook(() =>
      useRegisterFormCompletionEffect({
        register: { isLoading: true, data: undefined, error: undefined },
        completionPendingRef,
        snackbar: { show, dismiss },
        setSession,
        returnUrl: '/next',
        fallbackPath: '/',
        onRedirect,
        onSuccess,
      }),
    );
    expect(show).not.toHaveBeenCalled();
    expect(setSession).not.toHaveBeenCalled();
  });

  it('should show a formatted error via snackbar and not set session when register returns an error', async () => {
    const completionPendingRef = { current: true };
    const { rerender } = renderHook(
      (props: {
        register: {
          isLoading: boolean;
          data: undefined;
          error: CommonError | undefined;
        };
      }) =>
        useRegisterFormCompletionEffect({
          register: props.register,
          completionPendingRef,
          snackbar: { show, dismiss },
          setSession,
          returnUrl: null,
          fallbackPath: '/',
          onRedirect,
          onSuccess,
        }),
      {
        initialProps: {
          register: { isLoading: true, data: undefined, error: undefined },
        },
      },
    );

    rerender({
      register: {
        isLoading: false,
        data: undefined,
        error: new CommonError(400, ErrorTypes.WRONG_PARAM, 'invalid payload'),
      },
    });

    await waitFor(() => {
      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          message: expect.any(String),
        }),
      );
    });
    expect(setSession).not.toHaveBeenCalled();
  });

  it('should set authenticated session and show success snackbar when register succeeds', async () => {
    const completionPendingRef = { current: true };
    const { rerender } = renderHook(
      (props: {
        register: {
          isLoading: boolean;
          data:
            | {
                authToken: string;
                refreshToken: string;
                user: { id: string; email: string; firstName?: string; lastName?: string };
                requiresEmailVerification?: boolean;
              }
            | undefined;
          error: undefined;
        };
      }) =>
        useRegisterFormCompletionEffect({
          register: props.register,
          completionPendingRef,
          snackbar: { show, dismiss },
          setSession,
          returnUrl: '/dash',
          fallbackPath: '/',
          onRedirect,
          onSuccess,
        }),
      {
        initialProps: {
          register: { isLoading: true, data: undefined, error: undefined },
        },
      },
    );

    rerender({
      register: {
        isLoading: false,
        data: {
          authToken: 'at',
          refreshToken: 'rt',
          user: { id: 'u1', email: 'e@e.com', firstName: 'E', lastName: 'M' },
          requiresEmailVerification: false,
        },
        error: undefined,
      },
    });

    await waitFor(() => {
      expect(setSession).toHaveBeenCalledWith({
        user: expect.objectContaining({ id: 'u1', email: 'e@e.com' }),
        status: 'authenticated',
      });
    });
    await waitFor(() => {
      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'success',
        }),
      );
    });
  });

  it('should show a verification pending snackbar message when the API requires email verification', async () => {
    const completionPendingRef = { current: true };
    const { rerender } = renderHook(
      (props: {
        register: {
          isLoading: boolean;
          data:
            | {
                authToken: string;
                refreshToken: string;
                user: { id: string; email: string };
                requiresEmailVerification?: boolean;
              }
            | undefined;
          error: undefined;
        };
      }) =>
        useRegisterFormCompletionEffect({
          register: props.register,
          completionPendingRef,
          snackbar: { show, dismiss },
          setSession,
          returnUrl: null,
          fallbackPath: '/',
          onRedirect,
          onSuccess,
        }),
      {
        initialProps: {
          register: { isLoading: true, data: undefined, error: undefined },
        },
      },
    );

    rerender({
      register: {
        isLoading: false,
        data: {
          authToken: 'at',
          refreshToken: 'rt',
          user: { id: 'u1', email: 'e@e.com' },
          requiresEmailVerification: true,
        },
        error: undefined,
      },
    });

    await waitFor(() => {
      expect(
        show.mock.calls.some(
          (call) =>
            call[0]?.variant === 'info' &&
            typeof call[0]?.message === 'string' &&
            /verify|email|confirm/i.test(call[0].message as string),
        ),
      ).toBe(true);
    });
  });

  it('should call onRedirect with verification pending path when email verification is required and path is set', async () => {
    const completionPendingRef = { current: true };
    const { rerender } = renderHook(
      (props: {
        register: {
          isLoading: boolean;
          data:
            | {
                authToken: string;
                refreshToken: string;
                user: { id: string; email: string };
                requiresEmailVerification?: boolean;
              }
            | undefined;
          error: undefined;
        };
      }) =>
        useRegisterFormCompletionEffect({
          register: props.register,
          completionPendingRef,
          snackbar: { show, dismiss },
          setSession,
          returnUrl: '/dash',
          fallbackPath: '/home',
          verificationPendingPath: '/register/pending',
          onRedirect,
          onSuccess,
        }),
      {
        initialProps: {
          register: { isLoading: true, data: undefined, error: undefined },
        },
      },
    );

    rerender({
      register: {
        isLoading: false,
        data: {
          authToken: 'at',
          refreshToken: 'rt',
          user: { id: 'u1', email: 'e@e.com' },
          requiresEmailVerification: true,
        },
        error: undefined,
      },
    });

    await waitFor(() => {
      expect(onRedirect).toHaveBeenCalledWith('/register/pending');
    });
  });

  it('should call onRedirect with the resolved target after successful registration', async () => {
    const completionPendingRef = { current: true };
    const { rerender } = renderHook(
      (props: {
        register: {
          isLoading: boolean;
          data:
            | { authToken: string; refreshToken: string; user: { id: string; email: string } }
            | undefined;
          error: undefined;
        };
      }) =>
        useRegisterFormCompletionEffect({
          register: props.register,
          completionPendingRef,
          snackbar: { show, dismiss },
          setSession,
          returnUrl: '/target',
          fallbackPath: '/home',
          onRedirect,
          onSuccess,
        }),
      {
        initialProps: {
          register: { isLoading: true, data: undefined, error: undefined },
        },
      },
    );

    rerender({
      register: {
        isLoading: false,
        data: {
          authToken: 'a',
          refreshToken: 'b',
          user: { id: '1', email: 'x@x.com' },
        },
        error: undefined,
      },
    });

    await waitFor(() => {
      expect(onRedirect).toHaveBeenCalledWith('/target');
    });
  });

  it('should invoke onSuccess with auth tokens and user after successful registration', async () => {
    const completionPendingRef = { current: true };
    const { rerender } = renderHook(
      (props: {
        register: {
          isLoading: boolean;
          data:
            | { authToken: string; refreshToken: string; user: { id: string; email: string } }
            | undefined;
          error: undefined;
        };
      }) =>
        useRegisterFormCompletionEffect({
          register: props.register,
          completionPendingRef,
          snackbar: { show, dismiss },
          setSession,
          returnUrl: null,
          fallbackPath: '/',
          onRedirect,
          onSuccess,
        }),
      {
        initialProps: {
          register: { isLoading: true, data: undefined, error: undefined },
        },
      },
    );

    rerender({
      register: {
        isLoading: false,
        data: {
          authToken: 'tok',
          refreshToken: 'ref',
          user: { id: '9', email: 'n@n.com' },
        },
        error: undefined,
      },
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          authToken: 'tok',
          refreshToken: 'ref',
          user: expect.objectContaining({ id: '9' }),
        }),
      );
    });
  });

  it('should not run success or error handling when completion is not marked pending', () => {
    const completionPendingRef = { current: false };
    renderHook(() =>
      useRegisterFormCompletionEffect({
        register: {
          isLoading: false,
          data: { authToken: 'a', refreshToken: 'b', user: { id: '1', email: 'x@x.com' } },
          error: undefined,
        },
        completionPendingRef,
        snackbar: { show, dismiss },
        setSession,
        returnUrl: null,
        fallbackPath: '/',
        onRedirect,
        onSuccess,
      }),
    );
    expect(setSession).not.toHaveBeenCalled();
    expect(show).not.toHaveBeenCalled();
    expect(onRedirect).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
