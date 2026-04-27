import { describe, it, expect } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { formatLoginErrorMessage } from './formatLoginErrorMessage';

describe('formatLoginErrorMessage', () => {
  it('should return a generic sign-in message for a credential error', () => {
    const message = formatLoginErrorMessage(
      new CommonError(401, ErrorTypes.UNAUTHORIZED, 'Invalid credentials'),
    );
    expect(message).toBe('Sign-in failed. Check your email and password.');
  });

  it('should not reveal that the user was not found', () => {
    const message = formatLoginErrorMessage(
      new CommonError(404, ErrorTypes.NOT_FOUND, 'User not found'),
    );
    expect(message).toBe('Sign-in failed. Check your email and password.');
  });

  it('should not reveal a password-only failure message from the API', () => {
    const message = formatLoginErrorMessage(
      new CommonError(401, ErrorTypes.UNAUTHORIZED, 'Password incorrect'),
    );
    expect(message).toBe('Sign-in failed. Check your email and password.');
  });

  it('should return a connection message for a network failure', () => {
    const message = formatLoginErrorMessage(
      new CommonError(0, ErrorTypes.INTERNAL_ERROR, 'NetworkError when attempting to fetch resource'),
    );
    expect(message).toBe('Unable to connect. Please try again.');
  });

  it('should return a timeout message for a timeout error', () => {
    const message = formatLoginErrorMessage(
      new CommonError(408, ErrorTypes.TIMEOUT, 'The operation was aborted due to a timeout'),
    );
    expect(message).toBe('Connection timed out. Please try again.');
  });

  it('should return a generic fallback for an unknown error', () => {
    const message = formatLoginErrorMessage(
      new CommonError(500, ErrorTypes.INTERNAL_ERROR, 'Unexpected'),
    );
    expect(message).toBe('An error occurred. Please try again.');
  });

  it('should not return raw internal or database messages from the API', () => {
    const message = formatLoginErrorMessage(
      new CommonError(
        500,
        ErrorTypes.INTERNAL_ERROR,
        "SQLITE_CORRUPT: /var/secret.db — constraint failed (users.email)",
      ),
    );
    expect(message).not.toMatch(/SQLITE/i);
    expect(message).not.toMatch(/\/var\/secret/);
    expect(message).toBe('An error occurred. Please try again.');
  });
});
