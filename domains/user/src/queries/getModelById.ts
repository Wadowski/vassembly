import { getDbById } from '@vassembly/queries';

import { userMongodbDao } from '../clients';
import { userFactory } from '../model';

import type { UserModel } from '../model';

export const getModelById = getDbById<UserModel>({
  dao: userMongodbDao,
  factory: userFactory,
});
