import { AwsSesClient } from '@vassembly/client-aws-ses';
import { InternalError } from '@vassembly/errors';
import { config } from '@vassembly/config';

import {
  VERIFICATION_EMAIL_CONFIG_ERROR,
  VERIFICATION_EMAIL_ERROR_CONTEXT,
} from './constants';
import type { SendVerificationEmailCommand } from './types';

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

export const sendVerificationEmail = async (
  params: SendVerificationEmailCommand,
): Promise<void> => {
  const { to, verificationUrl } = params;
  const { fromEmail, emailVerificationTemplateName } = config.aws.ses;

  if (!fromEmail) {
    console.warn(`${VERIFICATION_EMAIL_CONFIG_ERROR}; verification email skipped`);
    if (isProduction()) {
      throw new InternalError('Verification email is not configured');
    }
    return;
  }

  try {
    const client = AwsSesClient();
    await client.sendEmail({
      templateName: emailVerificationTemplateName,
      recipients: [to],
      source: fromEmail,
      templateData: { verificationUrl },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown error';
    console.warn(`${VERIFICATION_EMAIL_ERROR_CONTEXT}: ${detail}`);
    if (isProduction()) {
      throw new InternalError('Failed to send verification email', error);
    }
  }
};
