import { randomString } from "@vassembly/client-encoder";
import { CommonError, InternalError } from "@vassembly/errors";

import { getByEmail } from "../../queries";
import { requestPasswordReset } from "../requestPasswordReset";
import { sendResetPasswordEmail } from "../sendResetPasswordEmail";
import { buildResetUrl } from "../../utils/buildResetUrl";
import type { InitiatePasswordResetCommand } from "./types";

export const initiatePasswordReset = async ({
  email,
}: InitiatePasswordResetCommand): Promise<void> => {
  const normalizedEmail = email.trim();

  let user;
  try {
    user = await getByEmail({ email: normalizedEmail });
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError("Failed to lookup user by email", error);
  }

  if (user?.id && user.email) {
    const token = randomString(32);

    try {
      await requestPasswordReset({
        userId: user.id,
        token,
      });
    } catch (error) {
      if (error instanceof CommonError) {
        throw error;
      }
      throw new InternalError("Failed to request password reset", error);
    }

    const resetUrl = buildResetUrl({ token });
    if (!resetUrl) {
      console.warn("domain-user :: AUTH_PASSWORD_RESET_WEB_URL missing; reset email not sent");
    } else {
      try {
        await sendResetPasswordEmail({ to: user.email, resetUrl });
      } catch (error) {
        if (error instanceof CommonError) {
          throw error;
        }
        throw new InternalError("Failed to send password reset email", error);
      }
    }
  }
};
