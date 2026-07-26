import userDomain from '@vassembly/domain-user';
import { CommonError, InternalError } from '@vassembly/errors';

import type {
  ConfirmEmailVerificationInput,
  ConfirmEmailVerificationOutput,
} from './types';

export const confirmEmailVerification = async (
  input: ConfirmEmailVerificationInput,
): Promise<ConfirmEmailVerificationOutput> => {
  const { userId, token } = input;

  try {
    await userDomain.commands.confirmEmailVerification({ userId, token });
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError('Failed to confirm email verification', error);
  }

  return { success: true };
};
