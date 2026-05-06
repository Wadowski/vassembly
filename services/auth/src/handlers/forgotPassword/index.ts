import userDomain from "@vassembly/domain-user";
import { CommonError, InternalError } from "@vassembly/errors";

import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from "./constants";
import type { ForgotPasswordInput, ForgotPasswordOutput } from "./types";

export const forgotPassword = async (
  input: ForgotPasswordInput,
): Promise<ForgotPasswordOutput> => {
  const { email } = input;

  try {
    await userDomain.commands.initiatePasswordReset({ email });
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError("Failed to initiate password reset", error);
  }

  return { message: FORGOT_PASSWORD_SUCCESS_MESSAGE };
};
