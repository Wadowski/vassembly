import { ValidationError } from '@vassembly/errors';

import type { ValidatorResult } from '@vassembly/validation';

export const assertValidInput = <T>(result: ValidatorResult<T>): T => {
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.error);
  }

  return result.data;
};
