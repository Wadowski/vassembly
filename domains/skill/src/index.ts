import * as commands from './commands';
import * as queries from './queries';

import { mongodbIndexes } from './clients';
import { gqlSkillSchema } from './model';

export const skillDomain = {
  commands,
  queries,
  mongodbIndexes,
  gqlSchema: gqlSkillSchema,
};

export { commands, queries, mongodbIndexes, gqlSkillSchema as gqlSchema };

export {
  SkillModel,
  skillFactory,
  toSkillResponse,
} from './model';

export type { SkillListResponse, SkillResponse, SkillScript, SkillScriptLanguage } from './model';

export type {
  GetActiveRuleByNameParams,
  GetActiveRuleByNameResult,
} from './queries';

export {
  getSkillsCollection,
  mongodbIndexes as skillMongodbIndexes,
  skillMongodbDao,
} from './clients';

export {
  COLLECTION_NAME,
  SKILL_DESCRIPTION_MAX_LENGTH,
  SKILL_NAME_MAX_LENGTH,
  SKILL_RULE_MAX_LENGTH,
  SKILL_SCRIPT_LANGUAGES,
  SKILL_SCRIPT_MAX_COUNT,
  SKILL_SCRIPT_MAX_SIZE_BYTES,
} from './constants';

export { formatSkillsCatalogSection } from './utils/formatSkillsCatalogSection';
export type { FormatSkillsCatalogSectionParams } from './utils/formatSkillsCatalogSection';

export default skillDomain;
