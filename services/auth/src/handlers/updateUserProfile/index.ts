import userDomain from "@vassembly/domain-user";
import { CommonError, InternalError, NotFoundError } from "@vassembly/errors";
import { validatorFactory } from "@vassembly/validation";

import { UPDATE_USER_PROFILE_INPUT_SCHEMA } from "./constants";
import type { UpdateUserProfileInput, UpdateUserProfileOutput } from "./types";

const validateUpdateUserProfileInput = validatorFactory(UPDATE_USER_PROFILE_INPUT_SCHEMA);

export const updateUserProfile = async (
  rawInput: UpdateUserProfileInput,
): Promise<UpdateUserProfileOutput> => {
  const parsed = validateUpdateUserProfileInput(rawInput);
  if (!parsed.success) {
    throw parsed.error;
  }
  const { userId, firstName, lastName } = parsed.data;

  try {
    const result = await userDomain.commands.update({
      id: userId,
      data: { firstName, lastName },
    });

    if (!result.data) {
      throw new NotFoundError("User not found");
    }

    return { user: result.data };
  } catch (error) {
    if (error instanceof CommonError) {
      throw error;
    }
    throw new InternalError("Failed to update user profile", error);
  }
};
