import { describe, it, expect } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { formatRegisterErrorMessage } from './formatRegisterErrorMessage';

describe('formatRegisterErrorMessage', () => {
  it('should return a friendly message when the email is already registered', () => {
    const message = formatRegisterErrorMessage(
      new CommonError(409, ErrorTypes.WRONG_PARAM, 'email already exists'),
    );
    expect(message).toMatch(/already|registered|exists|account/i);
    expect(message).not.toMatch(/SQLITE|constraint|users\.email/i);
  });

  it('should return a friendly message when the API reports password is too weak', () => {
    const message = formatRegisterErrorMessage(
      new CommonError(400, ErrorTypes.WRONG_PARAM, 'password does not meet policy'),
    );
    expect(message).toMatch(/password|weak|strength|requirements/i);
  });

  it('should map generic validation errors from the API to a safe user-facing message', () => {
    const message = formatRegisterErrorMessage(
      new CommonError(400, ErrorTypes.WRONG_PARAM, 'Validation failed'),
    );
    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toBe('Validation failed');
  });

  it('should return a connection message for a network failure', () => {
    const message = formatRegisterErrorMessage(
      new CommonError(0, ErrorTypes.INTERNAL_ERROR, 'NetworkError when attempting to fetch resource'),
    );
    expect(message).toMatch(/connect|try|again/i);
  });

  it('should return a timeout message for a timeout error', () => {
    const message = formatRegisterErrorMessage(
      new CommonError(408, ErrorTypes.TIMEOUT, 'The operation was aborted due to a timeout'),
    );
    expect(message).toMatch(/time|try|again/i);
  });

  it('should return a generic fallback for an unknown internal error', () => {
    const message = formatRegisterErrorMessage(
      new CommonError(500, ErrorTypes.INTERNAL_ERROR, 'Unexpected'),
    );
    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toBe('Unexpected');
  });

  it('should not return raw internal or database messages from the API', () => {
    const message = formatRegisterErrorMessage(
      new CommonError(
        500,
        ErrorTypes.INTERNAL_ERROR,
        "SQLITE_CORRUPT: /var/secret.db — constraint failed (users.email)",
      ),
    );
    expect(message).not.toMatch(/SQLITE/i);
    expect(message).not.toMatch(/\/var\/secret/);
  });
});
