import { AUTH_TOKEN_ROLE } from '@vassembly/constants';
import { ForbiddenError, NotFoundError } from '@vassembly/errors';
import { validatorFactory } from '@vassembly/validation';
import { z } from 'zod';

import { assertValidInput } from '../../commands/shared/assertValidInput';
import { getModelById } from '../getModelById';

import type { AssertHasRoleParams } from './types';

const OBJECT_ID_HEX = /^[a-f\d]{24}$/i;
const FORBIDDEN_MESSAGE = 'Admin access required';

const QUERY_INPUT_SCHEMA = z.object({
  userId: z
    .string()
    .trim()
    .min(1)
    .regex(OBJECT_ID_HEX, {
      message: 'userId must be a 24 character hexadecimal MongoDB ObjectId string',
    }),
  role: z.enum(Object.values(AUTH_TOKEN_ROLE) as [string, ...string[]]),
});

const validateQueryInput = validatorFactory(QUERY_INPUT_SCHEMA);

export const assertHasRole = async (input: AssertHasRoleParams): Promise<void> => {
  const { userId, role } = assertValidInput(validateQueryInput(input));

  let userResult;

  try {
    userResult = await getModelById({ id: userId });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ForbiddenError(FORBIDDEN_MESSAGE);
    }

    throw error;
  }

  const userRole = userResult.data.role ?? AUTH_TOKEN_ROLE.USER;

  if (userRole !== role) {
    throw new ForbiddenError(FORBIDDEN_MESSAGE);
  }
};
