import { z } from 'zod';

import type { ValidatorErrorResult } from './types';

export const getValidatorIssues = (result: ValidatorErrorResult): z.ZodIssue[] => {
  const cause = result.error.error;

  if (cause instanceof z.ZodError) {
    return cause.issues;
  }

  return [];
};
