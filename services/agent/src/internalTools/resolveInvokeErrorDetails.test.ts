import { describe, expect, it } from 'vitest';

import { ErrorTypes, InternalError } from '@vassembly/errors';

import { resolveInvokeErrorDetails } from './resolveInvokeErrorDetails';

describe('resolveInvokeErrorDetails', () => {
  it('should extract message and type from CommonError', () => {
    const error = new InternalError('Failed to invoke LM Studio model');

    expect(resolveInvokeErrorDetails(error)).toEqual(
      expect.objectContaining({
        message: 'Failed to invoke LM Studio model',
        type: ErrorTypes.INTERNAL_ERROR,
      }),
    );
  });

  it('should unwrap nested cause from CommonError', () => {
    const rootError = new Error('Connection refused');
    const error = new InternalError('Failed to invoke LM Studio model', rootError);

    expect(resolveInvokeErrorDetails(error)).toEqual(
      expect.objectContaining({
        message: 'Connection refused',
        type: ErrorTypes.INTERNAL_ERROR,
        stackTrace: rootError.stack,
      }),
    );
  });

  it('should extract message from plain Error', () => {
    const error = new Error('Provider invoke failed');

    expect(resolveInvokeErrorDetails(error)).toEqual(
      expect.objectContaining({
        message: 'Provider invoke failed',
      }),
    );
  });

  it('should extract message from object with message field', () => {
    expect(resolveInvokeErrorDetails({ message: 'LM Studio connection refused' })).toEqual({
      message: 'LM Studio connection refused',
    });
  });

  it('should return Unknown error for unsupported values', () => {
    expect(resolveInvokeErrorDetails(null)).toEqual({
      message: 'Unknown error',
    });
  });
});
