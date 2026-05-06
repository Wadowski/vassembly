import { CommonError, InternalError, UnauthorizedError, WrongParamError } from "@vassembly/errors";

import { createUserFactory } from "../../model";
import { resolveUserIdForPasswordReset } from "../../queries/resolveUserIdForPasswordReset";
import { completePasswordReset } from "../completePasswordReset";
import { sendResetPasswordEmail } from "../sendResetPasswordEmail";
import { RESET_TOKEN_HEX_PATTERN } from "./constants";
import type { ResetPasswordCommand, ResetPasswordCommandResult } from "./types";

const userPublicFactory = createUserFactory();

export const resetPassword = async (
  input: ResetPasswordCommand,
): Promise<ResetPasswordCommandResult> => {
  const { token, password } = input;

  if (!RESET_TOKEN_HEX_PATTERN.test(token)) {
    throw new WrongParamError("Invalid password reset token format");
  }

  let userId: string | null;
  try {
    userId = await resolveUserIdForPasswordReset({
      plainToken: token,
    });
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError("Failed to resolve password reset token", error);
  }

  if (!userId) {
    throw new UnauthorizedError("Invalid or expired password reset token");
  }

  let result;
  try {
    result = await completePasswordReset({
      userId,
      plainToken: token,
      newPassword: password,
    });

    if (!result.data) {
      throw new InternalError("Password reset returned no user");
    }
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError("Failed to complete password reset", error);
  }

  const user = result.data;

  try {
    const recipientEmail = user.email;
    if (!recipientEmail) {
      throw new InternalError("Password reset completed but user has no email");
    }
    await sendResetPasswordEmail({
      to: recipientEmail,
      resetUrl: "",
    });
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
  }

  return { data: userPublicFactory.toPublicResponse(user) };
};
