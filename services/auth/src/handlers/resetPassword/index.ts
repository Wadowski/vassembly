import userDomain from "@vassembly/domain-user";
import { CommonError, InternalError } from "@vassembly/errors";

import type { ResetPasswordInput, ResetPasswordOutput } from "./types";

export const resetPassword = async (
  input: ResetPasswordInput,
): Promise<ResetPasswordOutput> => {
  const { token, password } = input;

  try {
    const result = await userDomain.commands.resetPassword({
      token,
      password,
    });

    return { user: result.data };
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError("Failed to reset password", error);
  }
};
