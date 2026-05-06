import userDomain from "@vassembly/domain-user";
import { CommonError, InternalError, UnauthorizedError, ValidationError } from "@vassembly/errors";
import { validatorFactory } from "@vassembly/validation";

import { CHANGE_PASSWORD_HANDLER_SCHEMA } from "./constants";
import type { ChangePasswordInput, ChangePasswordOutput } from "./types";

const validateChangePasswordHandlerInput = validatorFactory(CHANGE_PASSWORD_HANDLER_SCHEMA);

export const changePassword = async (rawInput: ChangePasswordInput): Promise<ChangePasswordOutput> => {
  const parsed = validateChangePasswordHandlerInput(rawInput);
  if (!parsed.success) {
    throw parsed.error;
  }
  const { userId, currentPassword, newPassword } = parsed.data;

  try {
    await userDomain.commands.changePassword({ userId, currentPassword, newPassword });
  } catch (error) {
    if (error instanceof UnauthorizedError && error.message === "Current password is incorrect") {
      throw new ValidationError("Current password is incorrect");
    }
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError("Failed to change password", error);
  }

  return { success: true };
};
