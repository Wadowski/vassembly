import type { FormEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { useRegisterForm } from './useRegisterForm';

const validPassword = 'Str0ng!Pass';

const h = vi.hoisted(() => {
  return {
    register: {
      data: undefined as
        | {
            authToken: string;
            refreshToken: string;
            user: { id: string; email: string; firstName?: string; lastName?: string };
            requiresEmailVerification?: boolean;
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
  useRegister: () => h.register,
}));

vi.mock('@vassembly/ui-user-auth', () => ({
  useUserAuth: () => ({ setSession: h.setSession }),
}));

vi.mock('@vassembly/ui-snackbar', () => ({
  useSnackbar: () => ({ show: h.show }),
}));

const mockOrigin = 'https://app.example.com';

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.register.data = undefined;
    h.register.error = undefined;
    h.register.isLoading = false;
    h.register.fetch = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { ...window.location, origin: mockOrigin, href: `${mockOrigin}/` },
    });
  });

  it('should initialize with empty email, password, confirm password, first name, and last name', () => {
    const { result } = renderHook(() => useRegisterForm({}));
    expect(result.current.email).toBe('');
    expect(result.current.password).toBe('');
    expect(result.current.confirmPassword).toBe('');
    expect(result.current.firstName).toBe('');
    expect(result.current.lastName).toBe('');
  });

  it('should update email when handleEmailChange is called with a new value', () => {
    const { result } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handleEmailChange('new@example.com');
    });
    expect(result.current.email).toBe('new@example.com');
  });

  it('should update password when handlePasswordChange is called with a new value', () => {
    const { result } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handlePasswordChange(validPassword);
    });
    expect(result.current.password).toBe(validPassword);
  });

  it('should update confirm password when handleConfirmPasswordChange is called with a new value', () => {
    const { result } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handleConfirmPasswordChange(validPassword);
    });
    expect(result.current.confirmPassword).toBe(validPassword);
  });

  it('should update first name when handleFirstNameChange is called with a new value', () => {
    const { result } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handleFirstNameChange('Jane');
    });
    expect(result.current.firstName).toBe('Jane');
  });

  it('should update last name when handleLastNameChange is called with a new value', () => {
    const { result } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handleLastNameChange('Doe');
    });
    expect(result.current.lastName).toBe('Doe');
  });

  it('should call register fetch with trimmed body fields when the form is valid', async () => {
    h.register.fetch = vi.fn(async () => {
      h.register.data = {
        authToken: 'a',
        refreshToken: 'r',
        user: { id: '1', email: 'x@x.com', firstName: 'J', lastName: 'D' },
      };
    });
    const { result, rerender } = renderHook(() => useRegisterForm({ fallbackPath: '/' }));
    act(() => {
      result.current.handleEmailChange('  x@x.com  ');
      result.current.handlePasswordChange(`  ${validPassword}  `);
      result.current.handleConfirmPasswordChange(`  ${validPassword}  `);
      result.current.handleFirstNameChange('  Jane  ');
      result.current.handleLastNameChange('  Doe  ');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.register.fetch).toHaveBeenCalledWith({
      body: {
        email: 'x@x.com',
        password: validPassword,
        firstName: 'Jane',
        lastName: 'Doe',
      },
    });
    await act(() => {
      rerender();
    });
    await waitFor(() => {
      expect(h.setSession).toHaveBeenCalled();
    });
  });

  it('should expose isLoading from the register request while submitting', () => {
    h.register.isLoading = true;
    const { result } = renderHook(() => useRegisterForm({}));
    expect(result.current.isLoading).toBe(true);
  });

  it('should show a snackbar and not call register fetch when the email is invalid', async () => {
    h.register.fetch = vi.fn();
    const { result } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handleEmailChange('not-email');
      result.current.handlePasswordChange(validPassword);
      result.current.handleConfirmPasswordChange(validPassword);
      result.current.handleFirstNameChange('J');
      result.current.handleLastNameChange('D');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.show).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'error',
      }),
    );
    expect(h.register.fetch).not.toHaveBeenCalled();
  });

  it('should show a snackbar and not call register fetch when confirm password does not match', async () => {
    h.register.fetch = vi.fn();
    const { result } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handleEmailChange('ok@example.com');
      result.current.handlePasswordChange(validPassword);
      result.current.handleConfirmPasswordChange(`${validPassword}xx`);
      result.current.handleFirstNameChange('J');
      result.current.handleLastNameChange('D');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.show).toHaveBeenCalled();
    expect(h.register.fetch).not.toHaveBeenCalled();
  });

  it('should not call fetch while the register request is still loading', async () => {
    h.register.isLoading = true;
    h.register.fetch = vi.fn();
    const { result } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handleEmailChange('a@a.com');
      result.current.handlePasswordChange(validPassword);
      result.current.handleConfirmPasswordChange(validPassword);
      result.current.handleFirstNameChange('A');
      result.current.handleLastNameChange('B');
    });
    await act(async () => {
      await result.current.handleSubmit(
        { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>,
      );
    });
    expect(h.register.fetch).not.toHaveBeenCalled();
  });

  it('should show a snackbar with a user-safe message when register returns an error', async () => {
    h.register.fetch = vi.fn(async () => {
      h.register.error = new CommonError(409, ErrorTypes.WRONG_PARAM, 'email exists');
    });
    const { result, rerender } = renderHook(() => useRegisterForm({}));
    act(() => {
      result.current.handleEmailChange('taken@example.com');
      result.current.handlePasswordChange(validPassword);
      result.current.handleConfirmPasswordChange(validPassword);
      result.current.handleFirstNameChange('J');
      result.current.handleLastNameChange('D');
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
          variant: 'error',
        }),
      );
    });
  });

  it('should call onRedirect with the resolved path after a successful response', async () => {
    const onRedirect = vi.fn();
    h.register.fetch = vi.fn(async () => {
      h.register.data = {
        authToken: 't',
        refreshToken: 'r',
        user: { id: '1', email: 'u@e.com', firstName: 'U', lastName: 'E' },
      };
    });
    const { result, rerender } = renderHook(() =>
      useRegisterForm({ returnUrl: '/next', fallbackPath: '/', onRedirect }),
    );
    act(() => {
      result.current.handleEmailChange('u@e.com');
      result.current.handlePasswordChange(validPassword);
      result.current.handleConfirmPasswordChange(validPassword);
      result.current.handleFirstNameChange('U');
      result.current.handleLastNameChange('E');
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

  it('should not call onRedirect when register returns an error', async () => {
    const onRedirect = vi.fn();
    h.register.fetch = vi.fn(async () => {
      h.register.error = new CommonError(400, ErrorTypes.WRONG_PARAM, 'bad');
    });
    const { result, rerender } = renderHook(() => useRegisterForm({ onRedirect }));
    act(() => {
      result.current.handleEmailChange('a@a.com');
      result.current.handlePasswordChange(validPassword);
      result.current.handleConfirmPasswordChange(validPassword);
      result.current.handleFirstNameChange('J');
      result.current.handleLastNameChange('D');
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
});
