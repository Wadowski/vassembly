import { ValidationError } from '@vassembly/errors';

import type { GetByIdInput } from '../getById/types';

export const assertGetByIdInput = (input: GetByIdInput): void => {
  if (!input.id) {
    throw new ValidationError('id is required');
  }

  if (!input.userId) {
    throw new ValidationError('userId is required');
  }
};
