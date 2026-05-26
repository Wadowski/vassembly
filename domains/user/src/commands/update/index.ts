import { updateDbById } from '@vassembly/commands';

import { userMongodbDao } from '../../clients';
import { UserModel, toUserPublicResponse, userFactory } from '../../model';
import { UPDATE_USER_VALIDATION_SCHEMA } from './constants';
import type { UpdateUserCommandParams, UpdateUserCommandResult } from './types';

const updateDb = updateDbById<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
  validationSchema: UPDATE_USER_VALIDATION_SCHEMA,
});

export const update = async ({
  id,
  data,
}: UpdateUserCommandParams): Promise<UpdateUserCommandResult> => {
  const result = await updateDb({ id, data });
  if (!result.data) {
    return { data: undefined };
  }
  return { data: toUserPublicResponse({ user: result.data }) };
};
