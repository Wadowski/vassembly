import { describe, it, expect } from 'vitest';
import { CommonError, ErrorTypes } from '@vassembly/errors';
import { formatForgotPasswordErrorMessage } from './formatForgotPasswordErrorMessage';

const GENERIC = 'We could not complete your request. Please try again.';

describe('formatForgotPasswordErrorMessage', () => {
  it('should return a generic timeout message for a timeout error', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(408, ErrorTypes.TIMEOUT, 'The operation was aborted due to a timeout'),
    );
    expect(message).toBe('Connection timed out. Please try again.');
  });

  it('should return a connection message when status is zero', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(0, ErrorTypes.INTERNAL_ERROR, 'fetch failed'),
    );
    expect(message).toBe('Unable to connect. Please try again.');
  });

  it('should return a connection message when the error message indicates network failure', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(500, ErrorTypes.INTERNAL_ERROR, 'NetworkError when attempting to fetch resource'),
    );
    expect(message).toBe('Unable to connect. Please try again.');
  });

  it('should return a privacy-aware generic message for 4xx errors', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(400, ErrorTypes.WRONG_PARAM, 'Invalid request body'),
    );
    expect(message).toBe(GENERIC);
  });

  it('should return a generic message for 5xx errors', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(500, ErrorTypes.INTERNAL_ERROR, 'Unexpected'),
    );
    expect(message).toBe(GENERIC);
  });

  it('should not enumerate accounts for unauthorized responses', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(401, ErrorTypes.UNAUTHORIZED, 'Invalid credentials'),
    );
    expect(message).toBe(GENERIC);
    expect(message).not.toMatch(/credentials/i);
  });

  it('should not enumerate accounts for not-found responses', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(404, ErrorTypes.NOT_FOUND, 'User not found'),
    );
    expect(message).toBe(GENERIC);
    expect(message).not.toMatch(/not found/i);
  });

  it('should not enumerate accounts for forbidden responses', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(403, ErrorTypes.FORBIDDEN, 'Access denied'),
    );
    expect(message).toBe(GENERIC);
  });

  it('should return generic fallback for unknown errors without leaking internal details', () => {
    const message = formatForgotPasswordErrorMessage(
      new CommonError(
        500,
        ErrorTypes.INTERNAL_ERROR,
        "SQLITE_CORRUPT: /var/secret.db — constraint failed (users.email)",
      ),
    );
    expect(message).not.toMatch(/SQLITE/i);
    expect(message).not.toMatch(/\/var\/secret/);
    expect(message).toBe(GENERIC);
  });
});
