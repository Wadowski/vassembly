import type { FormEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { useForgotPasswordForm } from './useForgotPasswordForm';

const h = vi.hoisted(() => {
  return {
    forgot: {
      data: undefined as { ok: boolean; message?: string } | undefined,
      error: undefined as CommonError | undefined,
      isLoading: false,
      fetch: vi.fn(),
    },
    show: vi.fn(),
  };
});

vi.mock('@vassembly/ui-api-hooks', () => ({
  useForgotPassword: () => h.forgot,
}));

vi.mock('@vassembly/ui-snackbar', () => ({
  useSnackbar: () => ({ show: h.show }),
}));

const createSubmitEvent = (): FormEvent<HTMLFormElement> => {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
};

describe('useForgotPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.forgot.data = undefined;
    h.forgot.error = undefined;
    h.forgot.isLoading = false;
    h.forgot.fetch = vi.fn();
  });

  it('should initialize with empty email, isLoading false, and isSuccess false', () => {
    const { result } = renderHook(() => useForgotPasswordForm({}));
    expect(result.current.email).toBe('');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('should update email when handleEmailChange is called with a new value', () => {
    const { result } = renderHook(() => useForgotPasswordForm({}));
    act(() => {
      result.current.handleEmailChange('user@example.com');
    });
    expect(result.current.email).toBe('user@example.com');
  });

  it('should show a validation error snackbar and not call fetch when the email is empty', async () => {
    h.forgot.fetch = vi.fn();
    const { result } = renderHook(() => useForgotPasswordForm({}));
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(h.show).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'error',
        message: expect.stringMatching(/.+/u),
      }),
    );
    expect(h.forgot.fetch).not.toHaveBeenCalled();
  });

  it('should show a validation error snackbar and not call fetch when the email format is invalid', async () => {
    h.forgot.fetch = vi.fn();
    const { result } = renderHook(() => useForgotPasswordForm({}));
    act(() => {
      result.current.handleEmailChange('not-an-email');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(h.show).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'error',
        message: expect.stringMatching(/.+/u),
      }),
    );
    expect(h.forgot.fetch).not.toHaveBeenCalled();
  });

  it('should call fetch with a trimmed body email when the email is valid', async () => {
    h.forgot.fetch = vi.fn(async () => {
      h.forgot.data = { ok: true, message: 'If an account exists, you will get email.' };
    });
    const { result, rerender } = renderHook(() => useForgotPasswordForm({}));
    act(() => {
      result.current.handleEmailChange('  user@example.com  ');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(h.forgot.fetch).toHaveBeenCalledWith({
      body: { email: 'user@example.com' },
    });
    await act(() => {
      rerender();
    });
  });

  it('should call fetch with a valid email after a previous submit failed validation for an empty email', async () => {
    h.forgot.fetch = vi.fn(async () => {
      h.forgot.data = { ok: true };
    });
    const { result, rerender } = renderHook(() => useForgotPasswordForm({}));
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(h.show).toHaveBeenCalled();
    expect(h.forgot.fetch).not.toHaveBeenCalled();
    vi.clearAllMocks();
    act(() => {
      result.current.handleEmailChange('ok@example.com');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(h.forgot.fetch).toHaveBeenCalledWith({
      body: { email: 'ok@example.com' },
    });
    await act(() => {
      rerender();
    });
  });

  it('should expose isLoading as true when the underlying forgot-password request is loading', () => {
    h.forgot.isLoading = true;
    const { result } = renderHook(() => useForgotPasswordForm({}));
    expect(result.current.isLoading).toBe(true);
  });

  it('should not call fetch when a forgot-password request is already in progress', async () => {
    h.forgot.isLoading = true;
    h.forgot.fetch = vi.fn();
    const { result } = renderHook(() => useForgotPasswordForm({}));
    act(() => {
      result.current.handleEmailChange('a@a.com');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(h.forgot.fetch).not.toHaveBeenCalled();
  });

  it('should set isSuccess true, show a success snackbar, and call onSuccess when the API response is successful', async () => {
    const onSuccess = vi.fn();
    h.forgot.fetch = vi.fn(async () => {
      h.forgot.data = { ok: true, message: 'If an account exists, instructions were sent.' };
    });
    const { result, rerender } = renderHook(() => useForgotPasswordForm({ onSuccess }));
    act(() => {
      result.current.handleEmailChange('user@example.com');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(h.show).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'success',
        message: expect.stringMatching(/.+/u),
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should work when onSuccess is not provided and the request succeeds', async () => {
    h.forgot.fetch = vi.fn(async () => {
      h.forgot.data = { ok: true };
    });
    const { result, rerender } = renderHook(() => useForgotPasswordForm({}));
    act(() => {
      result.current.handleEmailChange('user@example.com');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should show a user-friendly error snackbar, keep isSuccess false, and leave the form ready to retry when the API request fails', async () => {
    h.forgot.fetch = vi.fn(async () => {
      h.forgot.error = new CommonError(500, ErrorTypes.INTERNAL_ERROR, 'Service unavailable');
    });
    const { result, rerender } = renderHook(() => useForgotPasswordForm({}));
    act(() => {
      result.current.handleEmailChange('user@example.com');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.show).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'error',
          message: expect.stringMatching(/.+/u),
        }),
      );
    });
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.email).toBe('user@example.com');
    vi.clearAllMocks();
    h.forgot.error = undefined;
    h.forgot.fetch = vi.fn(async () => {
      h.forgot.data = { ok: true };
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.forgot.fetch).toHaveBeenCalled();
    });
  });
});
