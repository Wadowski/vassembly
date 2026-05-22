import * as commands from './commands';
import * as queries from './queries';

import { gqlAgentSchema } from './model';
import { mongodbIndexes } from './clients';

const agentDomain = {
  commands,
  queries,
  gqlSchema: gqlAgentSchema,
  mongodbIndexes,
};

export { commands, queries, gqlAgentSchema as gqlSchema, mongodbIndexes };
export type {
  AgentListStatusFilter,
  GetListForUserQueryInput,
} from './queries/getListForUser.types';
export { AGENT_LIST_ALL_STATUSES } from './queries/getListForUser.types';
export { AgentCategory, AgentStatus, toAgentResponse } from './model';
export type { AgentModel, AgentResponse } from './model';

export default agentDomain;
