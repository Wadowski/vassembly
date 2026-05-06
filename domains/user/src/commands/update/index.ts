import { updateDbById } from "@vassembly/commands";

import { userMongodbDao } from "../../clients";
import { UserModel, userFactory, createUserFactory } from "../../model";
import { UPDATE_USER_VALIDATION_SCHEMA } from "./constants";
import type { UpdateUserCommandParams, UpdateUserCommandResult } from "./types";

const updateDb = updateDbById<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: UPDATE_USER_VALIDATION_SCHEMA,
});

const userPublicFactory = createUserFactory();

export const update = async ({
  id,
  data,
}: UpdateUserCommandParams): Promise<UpdateUserCommandResult> => {
  const result = await updateDb({ id, data });
  if (!result.data) {
    return { data: undefined };
  }
  return { data: userPublicFactory.toPublicResponse(result.data) };
};
