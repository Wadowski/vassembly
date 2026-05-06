import { AwsSesClient } from "@vassembly/client-aws-ses";
import { InternalError } from "@vassembly/errors";
import { config } from "@vassembly/config";

import { SES_EMAIL_CONFIG_ERROR, SES_EMAIL_ERROR_CONTEXT } from "./constants";
import type { SendResetPasswordEmailCommand } from "./types";

const isProduction = (): boolean => process.env.NODE_ENV === "production";

export const sendResetPasswordEmail = async (
  params: SendResetPasswordEmailCommand,
): Promise<void> => {
  const { to, resetUrl } = params;
  const { fromEmail, passwordResetTemplateName } = config.aws.ses;

  if (!fromEmail) {
    console.warn(`${SES_EMAIL_CONFIG_ERROR}; reset email skipped`);
    if (isProduction()) {
      throw new InternalError("Password reset email is not configured");
    }
    return;
  }

  try {
    const client = AwsSesClient();
    await client.sendEmail({
      templateName: passwordResetTemplateName,
      recipients: [to],
      source: fromEmail,
      templateData: { resetUrl },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown error";
    console.warn(`${SES_EMAIL_ERROR_CONTEXT}: ${detail}`);
    if (isProduction()) {
      throw new InternalError("Failed to send password reset email", error);
    }
  }
};
