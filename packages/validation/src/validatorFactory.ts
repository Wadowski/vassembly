import { z } from 'zod';
import { InternalError, WrongParamError } from '@vassembly/errors';
import { ValidatorErrorResult, ValidatorResult, ValidatorSuccessResult } from './types';

export const isValidatorError = (result: ValidatorResult<unknown>): result is ValidatorErrorResult => {
  return !result.success;
};

export const isValidatorSuccess = <T>(result: ValidatorResult<T>): result is ValidatorSuccessResult<T> => {
  return result.success;
};

export const validatorFactory = <T extends z.ZodTypeAny>(schema: T) => (
  data: unknown
): ValidatorResult<z.infer<T>> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: new WrongParamError('Validation failed', result.error) };
};
