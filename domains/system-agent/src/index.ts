import * as commands from './commands';
import * as queries from './queries';

import { mongodbIndexes } from './clients';

import {
  AgentCategory,
  AgentStatus,
  SystemAgentModel,
  UserSystemAgentPreferenceModel,
  systemAgentFactory,
  systemAgentTranslationFactory,
  toDetail,
  toSystemAgentResponse,
  userSystemAgentPreferenceFactory,
} from './model';

import {
  SYSTEM_AGENT_DEFAULT_STATUS,
  SYSTEM_AGENT_DESCRIPTION_MAX_LENGTH,
  SYSTEM_AGENT_NAME_MAX_LENGTH,
  SYSTEM_AGENT_NAME_MIN_LENGTH,
  SYSTEM_AGENT_RULE_MAX_LENGTH,
  SYSTEM_AGENT_RULE_MIN_LENGTH,
} from './constants';

import {
  SYSTEM_AGENT_ERROR_CODES,
  throwSystemAgentConnectionInvalidError,
  throwSystemAgentConnectionRequiredError,
  throwSystemAgentNameConflictError,
  throwSystemAgentNotFoundError,
} from './errors';

const systemAgentDomain = {
  commands,
  queries,
  mongodbIndexes,
};

export { commands, queries, mongodbIndexes };

export {
  AgentCategory,
  AgentStatus,
  SystemAgentModel,
  UserSystemAgentPreferenceModel,
  systemAgentFactory,
  systemAgentTranslationFactory,
  userSystemAgentPreferenceFactory,
  toSystemAgentResponse,
  toDetail,
  SYSTEM_AGENT_DEFAULT_STATUS,
  SYSTEM_AGENT_DESCRIPTION_MAX_LENGTH,
  SYSTEM_AGENT_NAME_MAX_LENGTH,
  SYSTEM_AGENT_NAME_MIN_LENGTH,
  SYSTEM_AGENT_RULE_MAX_LENGTH,
  SYSTEM_AGENT_RULE_MIN_LENGTH,
  SYSTEM_AGENT_ERROR_CODES,
  throwSystemAgentConnectionInvalidError,
  throwSystemAgentConnectionRequiredError,
  throwSystemAgentNameConflictError,
  throwSystemAgentNotFoundError,
};

export {
  systemAgentMongodbDao,
  userSystemAgentPreferenceMongodbDao,
  SYSTEM_AGENT_COLLECTION_NAME,
  USER_SYSTEM_AGENT_PREFERENCE_COLLECTION_NAME,
  getSystemAgentsCollection,
  getUserSystemAgentPreferencesCollection,
  mongodbSystemAgentIndexes,
  mongodbPreferenceIndexes,
} from './clients';

export type {
  SystemAgentAdminResponse,
  SystemAgentCatalogListItem,
  SystemAgentCatalogDetail,
  SystemAgentPreferenceResponse,
} from './model';

export type { SystemAgentErrorCode } from './errors';

export default systemAgentDomain;
