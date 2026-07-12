import { describe, expect, it } from 'vitest';

import { InternalError } from '@vassembly/errors';

import { mapExecutionError } from './mapExecutionError';

describe('mapExecutionError', () => {
  it('should unwrap nested cause from CommonError', () => {
    const rootError = new Error('Connection refused');
    const error = new InternalError('Failed to invoke LM Studio model', rootError);

    expect(mapExecutionError(error)).toEqual({
      errorMessage: 'Connection refused',
      errorCode: 'INTERNAL_ERROR',
    });
  });
});
