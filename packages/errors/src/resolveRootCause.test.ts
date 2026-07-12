import { describe, expect, it } from 'vitest';

import { InternalError } from './InternalError';
import { resolveRootCause, resolveRootCauseMessage } from './resolveRootCause';

describe('resolveRootCause', () => {
  it('should return root message from wrapped InternalError', () => {
    const rootError = new Error('Connection refused');
    const wrappedError = new InternalError('Failed to invoke LM Studio model', rootError);

    expect(resolveRootCause(wrappedError)).toEqual(
      expect.objectContaining({
        message: 'Connection refused',
        stackTrace: rootError.stack,
      }),
    );
  });

  it('should return root message from nested InternalError chain', () => {
    const rootError = new Error('404 model not found');
    const wrappedError = new InternalError(
      'Failed to invoke LM Studio model',
      new InternalError('Provider request failed', rootError),
    );

    expect(resolveRootCauseMessage(wrappedError)).toBe('404 model not found');
  });

  it('should return wrapper message when no nested error exists', () => {
    const error = new InternalError('Failed to invoke LM Studio model');

    expect(resolveRootCauseMessage(error)).toBe('Failed to invoke LM Studio model');
  });

  it('should follow Error.cause chain', () => {
    const rootError = new Error('Request timed out');
    const wrappedError = new Error('Provider invoke failed', { cause: rootError });

    expect(resolveRootCauseMessage(wrappedError)).toBe('Request timed out');
  });
});
