import {
  CommonError,
  ForbiddenError,
  InternalError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  WrongParamError,
} from '@vassembly/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mapHttpStatusToError } from './mapHttpStatusToError';

describe('mapHttpStatusToError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should map known 4xx statuses to specific error classes', () => {
    expect(mapHttpStatusToError({ status: 400, message: 'bad' })).toBeInstanceOf(WrongParamError);
    expect(mapHttpStatusToError({ status: 401, message: 'no' })).toBeInstanceOf(UnauthorizedError);
    expect(mapHttpStatusToError({ status: 403, message: 'denied' })).toBeInstanceOf(ForbiddenError);
    expect(mapHttpStatusToError({ status: 404, message: 'gone' })).toBeInstanceOf(NotFoundError);
    expect(mapHttpStatusToError({ status: 429, message: 'slow down' })).toBeInstanceOf(
      TooManyRequestsError,
    );
  });

  it('should map 5xx statuses to InternalError', () => {
    const err = mapHttpStatusToError({ status: 503, message: 'down' });
    expect(err).toBeInstanceOf(InternalError);
    expect(err.message).toBe('down');
  });

  it('should map unlisted 4xx statuses to CommonError with that status', () => {
    const err = mapHttpStatusToError({ status: 409, message: 'Conflict' });
    expect(err).toBeInstanceOf(CommonError);
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('Conflict');
  });

  it('should map non-4xx non-5xx statuses to InternalError', () => {
    const err = mapHttpStatusToError({ status: 302, message: 'redirect' });
    expect(err).toBeInstanceOf(InternalError);
    expect(err.message).toBe('redirect');
  });
});
