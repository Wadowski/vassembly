import { z } from 'zod';
import { WrongParamError } from '@vassembly/errors';
import { ValidatorResult } from './types';

export const validatorFactory = <T extends z.ZodTypeAny>(schema: T) => (
  data: unknown
): ValidatorResult<z.infer<T>> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: new WrongParamError('Validation failed', result.error) };
};
