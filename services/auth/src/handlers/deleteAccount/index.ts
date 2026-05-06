import userDomain from "@vassembly/domain-user";
import { CommonError, InternalError } from "@vassembly/errors";
import { validatorFactory } from "@vassembly/validation";

import { DELETE_ACCOUNT_HANDLER_SCHEMA } from "./constants";
import type { DeleteAccountInput, DeleteAccountOutput } from "./types";

const validateDeleteAccountInput = validatorFactory(DELETE_ACCOUNT_HANDLER_SCHEMA);

export const deleteAccount = async (
  rawInput: DeleteAccountInput,
): Promise<DeleteAccountOutput> => {
  const parsed = validateDeleteAccountInput(rawInput);
  if (!parsed.success) {
    throw parsed.error;
  }
  const { userId } = parsed.data;

  try {
    return await userDomain.commands.deleteAccount({ userId });
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError("Failed to delete account", error);
  }
};
