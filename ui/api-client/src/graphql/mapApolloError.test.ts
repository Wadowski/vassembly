import { ApolloError } from '@apollo/client';
import { CommonError, ErrorTypes, InternalError, NotFoundError } from '@vassembly/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mapApolloError } from './mapApolloError';

describe('mapApolloError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should map Apollo network errors with statusCode using mapHttpStatusToError', () => {
    expect(() =>
      mapApolloError(
        new ApolloError({
          networkError: { statusCode: 404, message: 'nf' } as unknown as Error,
        }),
      ),
    ).toThrow(NotFoundError);
  });

  it('should map Apollo GraphQL errors to CommonError with INTERNAL_ERROR type', () => {
    let caught: unknown;
    try {
      mapApolloError(
        new ApolloError({
          graphQLErrors: [{ message: 'field invalid' }],
        }),
      );
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(CommonError);
    expect((caught as CommonError).type).toBe(ErrorTypes.INTERNAL_ERROR);
    expect((caught as CommonError).message).toBe('field invalid');
  });

  it('should map ApolloError without mappable details to InternalError', () => {
    expect(() =>
      mapApolloError(
        new ApolloError({
          errorMessage: 'Something failed',
          graphQLErrors: [],
          networkError: new Error('net'),
        }),
      ),
    ).toThrow(InternalError);
  });

  it('should map non-Apollo errors to InternalError', () => {
    expect(() => mapApolloError(new Error('plain'))).toThrow(InternalError);
  });
});
