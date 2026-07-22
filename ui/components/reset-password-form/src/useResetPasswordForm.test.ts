import type { FormEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import type { ResetPasswordResponse } from '@vassembly/ui-api-hooks';

import { RESET_PASSWORD_INVALID_LINK_MESSAGE } from './constants';
import { useResetPasswordForm } from './useResetPasswordForm';

const h = vi.hoisted(() => {
  return {
    reset: {
      data: undefined as ResetPasswordResponse | undefined,
      error: undefined as CommonError | undefined,
      isPending: false,
      mutate: vi.fn(),
    },
    show: vi.fn(),
  };
});

vi.mock('@vassembly/ui-api-hooks', () => ({
  useResetPassword: () => h.reset,
}));

vi.mock('@vassembly/ui-system-design/snackbar', () => ({
  useSnackbar: () => ({ show: h.show }),
}));

const createSubmitEvent = (): FormEvent<HTMLFormElement> => {
  return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
};

describe('useResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.reset.data = undefined;
    h.reset.error = undefined;
    h.reset.isPending = false;
    h.reset.mutate = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with empty fields and no field errors', () => {
    const { result } = renderHook(() => useResetPasswordForm({ token: 'tok' }));
    expect(result.current.password).toBe('');
    expect(result.current.confirmPassword).toBe('');
    expect(result.current.passwordError).toBeUndefined();
    expect(result.current.confirmPasswordError).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should set password field errors on submit when validation fails and not call mutate', async () => {
    h.reset.mutate = vi.fn();
    const { result } = renderHook(() => useResetPasswordForm({ token: 'tok' }));
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(result.current.passwordError).toMatch(/.+/u);
    expect(h.reset.mutate).not.toHaveBeenCalled();
  });

  it('should call mutate with token and password when values pass validation', async () => {
    h.reset.mutate = vi.fn(async () => {
      h.reset.data = { user: { id: 'u1' } };
    });
    const { result, rerender } = renderHook(() => useResetPasswordForm({ token: '  my-token  ' }));
    act(() => {
      result.current.handlePasswordChange('Password1');
      result.current.handleConfirmPasswordChange('Password1');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(h.reset.mutate).toHaveBeenCalledWith({ token: 'my-token', password: 'Password1' });
    await act(() => {
      rerender();
    });
  });

  it('should show a user-friendly snackbar when the API returns an invalid token error', async () => {
    h.reset.mutate = vi.fn(async () => {
      h.reset.error = new CommonError(404, ErrorTypes.NOT_FOUND, 'Reset token not found');
    });
    const { result, rerender } = renderHook(() => useResetPasswordForm({ token: 'tok' }));
    act(() => {
      result.current.handlePasswordChange('Password1');
      result.current.handleConfirmPasswordChange('Password1');
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
          message: RESET_PASSWORD_INVALID_LINK_MESSAGE,
        }),
      );
    });
  });

  it('should show a success snackbar and call onSuccess after the completion delay when reset succeeds', async () => {
    vi.useFakeTimers();
    const onSuccess = vi.fn();
    h.reset.mutate = vi.fn(async () => {
      h.reset.data = { user: { id: 'u1' } };
    });
    const { result, rerender } = renderHook(() =>
      useResetPasswordForm({ token: 'tok', onSuccess }),
    );
    act(() => {
      result.current.handlePasswordChange('Password1');
      result.current.handleConfirmPasswordChange('Password1');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    await act(() => {
      rerender();
    });
    expect(h.show).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'success',
      }),
    );
    await act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('should not call mutate while a reset request is already pending', async () => {
    h.reset.isPending = true;
    h.reset.mutate = vi.fn();
    const { result } = renderHook(() => useResetPasswordForm({ token: 'tok' }));
    act(() => {
      result.current.handlePasswordChange('Password1');
      result.current.handleConfirmPasswordChange('Password1');
    });
    await act(async () => {
      await result.current.handleSubmit(createSubmitEvent());
    });
    expect(h.reset.mutate).not.toHaveBeenCalled();
  });
});
