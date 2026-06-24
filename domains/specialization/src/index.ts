import * as commands from './commands';
import * as queries from './queries';

import { mongodbIndexes } from './clients';
import { gqlSpecializationSchema } from './model';

export const specializationDomain = {
  commands,
  queries,
  mongodbIndexes,
  gqlSchema: gqlSpecializationSchema,
};

export { commands, queries, mongodbIndexes, gqlSpecializationSchema as gqlSchema };

export {
  SpecializationModel,
  specializationFactory,
  toSpecializationResponse,
} from './model';

export type { SpecializationPageResponse, SpecializationResponse } from './model';

export {
  getSpecializationsCollection,
  specializationMongodbDao,
} from './clients';

export {
  COLLECTION_NAME,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SPECIALIZATION_DESCRIPTION_MAX_LENGTH,
  SPECIALIZATION_NAME_MAX_LENGTH,
  SPECIALIZATION_NAME_MIN_LENGTH,
} from './constants';

export default specializationDomain;
