import * as commands from './commands';
import * as queries from './queries';

import { gqlMcpUsageSchema } from './model';
import { mongodbIndexes } from './clients';

const mcpUsageDomain = {
  commands,
  queries,
  gqlSchema: gqlMcpUsageSchema,
  mongodbIndexes,
};

export { commands, queries, gqlMcpUsageSchema as gqlSchema, mongodbIndexes };
export {
  McpUsageEventModel,
  McpUsageStatus,
  toMcpUsageEventResponse,
} from './model';
export type { McpUsageEventResponse, McpUsageHistoryListResponse } from './model';

export default mcpUsageDomain;
