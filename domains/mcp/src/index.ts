import * as queries from './queries';

import { mongodbIndexes } from './clients';
import { gqlMcpSchema } from './model';
import { loadMcps } from './seed/loadMcps';

export const mcpDomain = {
  queries,
  mongodbIndexes,
  seedMcps: loadMcps,
  gqlSchema: gqlMcpSchema,
};

export { queries, mongodbIndexes, gqlMcpSchema as gqlSchema, loadMcps as seedMcps };

export { McpModel, mcpFactory, toMcpResponse } from './model';
export type { McpListItemResponse } from './model';
export { mcpMongodbDao, getMcpsCollection } from './clients';
export { COLLECTION_NAME, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';

export default mcpDomain;
