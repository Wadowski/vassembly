import { validatorFactory } from "@vassembly/validation";
import { NotFoundError } from "@vassembly/errors";

import { userMongodbDao } from "../../clients";
import { userFactory } from "../../model";
import { USER_ID_VALIDATION_SCHEMA } from "../userIdValidationSchema";
import { DELETE_ACCOUNT_COMMAND_SCHEMA } from "./constants";
import type { DeleteAccountCommand } from "./types";

const validateDeleteAccountInput = validatorFactory(DELETE_ACCOUNT_COMMAND_SCHEMA);

export const deleteAccount = async (
  rawInput: DeleteAccountCommand,
): Promise<{ success: true }> => {
  const validated = validateDeleteAccountInput(rawInput);
  if (!validated.success) {
    throw validated.error;
  }
  const { userId } = validated.data;

  const queryInstance = userFactory.create(
    { id: userId },
    { validationSchema: USER_ID_VALIDATION_SCHEMA },
  );
  queryInstance.isValid({ shouldThrow: true });

  const stored = await userMongodbDao.get(queryInstance);
  if (!stored) {
    throw new NotFoundError(`User with id ${userId} not found`);
  }

  const user = userFactory.create(stored);
  if (user.removedAt) {
    return { success: true };
  }

  await userMongodbDao.remove(queryInstance);
  return { success: true };
};

export type { DeleteAccountCommand } from "./types";
