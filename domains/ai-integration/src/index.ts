import * as commands from './commands';
import * as queries from './queries';

import { gqlAiIntegrationSchema } from './model';
import { mongodbIndexes } from './clients';

const aiIntegrationDomain = {
  commands,
  queries,
  gqlSchema: gqlAiIntegrationSchema,
  mongodbIndexes,
};

export { commands, queries, gqlAiIntegrationSchema as gqlSchema, mongodbIndexes };
export type { AiIntegrationCredentialModel, AiIntegrationCredentialResponse } from './model';
export { toAiIntegrationResponse } from './model/toAiIntegrationResponse';
export {
  AiIntegrationProvider,
  AiIntegrationStatus,
  AiIntegrationConnectionStatus,
} from './constants';
export type {
  AiIntegrationListStatusFilter,
  GetListForUserQueryInput,
} from './queries/getListForUser/types';
export { AI_INTEGRATION_LIST_ALL_STATUSES } from './queries/getListForUser/types';
export type { AiIntegrationSnapshot, ResolveAndBuildClientResult } from './commands/resolveAndBuildClient/types';

export default aiIntegrationDomain;
