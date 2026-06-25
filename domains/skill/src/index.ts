import * as queries from './queries';

import { mongodbIndexes } from './clients';
import { gqlSkillSchema } from './model';

export const skillDomain = {
  queries,
  mongodbIndexes,
  gqlSchema: gqlSkillSchema,
};

export { queries, mongodbIndexes, gqlSkillSchema as gqlSchema };

export {
  SkillModel,
  skillFactory,
  toSkillResponse,
} from './model';

export type { SkillListResponse, SkillResponse, SkillScript, SkillScriptLanguage } from './model';

export {
  getSkillsCollection,
  mongodbIndexes as skillMongodbIndexes,
  scriptStorageClient,
  skillMongodbDao,
} from './clients';

export {
  COLLECTION_NAME,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_SCRIPT_LANGUAGES,
  SKILL_SCRIPT_MAX_SIZE_BYTES,
} from './constants';

export default skillDomain;
