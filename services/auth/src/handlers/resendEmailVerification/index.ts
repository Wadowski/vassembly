import { randomString } from '@vassembly/client-encoder';
import userDomain from '@vassembly/domain-user';
import { buildVerificationUrl } from '@vassembly/domain-user';
import { CommonError, ConflictError, InternalError, TooManyRequestsError } from '@vassembly/errors';

import { RESEND_COOLDOWN_MS } from './constants';
import type { ResendEmailVerificationInput, ResendEmailVerificationOutput } from './types';

const resolveIssuedAtMs = ({ issuedAt }: { issuedAt: Date | string }): number => {
  if (issuedAt instanceof Date) {
    return issuedAt.getTime();
  }

  return new Date(issuedAt).getTime();
};

export const resendEmailVerification = async (
  input: ResendEmailVerificationInput,
): Promise<ResendEmailVerificationOutput> => {
  const { userId } = input;

  try {
    const userResult = await userDomain.queries.getModelById({ id: userId });
    const user = userResult.data;

    if (user.verifiedAt != null) {
      throw new ConflictError('Email already verified');
    }

    if (user.emailVerificationIssuedAt != null) {
      const elapsedMs = Date.now() - resolveIssuedAtMs({ issuedAt: user.emailVerificationIssuedAt });
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        throw new TooManyRequestsError('Resend cooldown active', { retryAfterSeconds });
      }
    }

    const token = randomString(32);
    await userDomain.commands.requestEmailVerification({ userId, token });

    const verificationUrl = buildVerificationUrl({ token });
    if (verificationUrl && user.email) {
      await userDomain.commands.sendVerificationEmail({
        to: user.email,
        verificationUrl,
      });
    }
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError('Failed to resend verification email', error);
  }

  return { success: true };
};
