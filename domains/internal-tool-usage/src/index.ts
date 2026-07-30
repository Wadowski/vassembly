import * as commands from './commands';
import * as queries from './queries';

import { gqlInternalToolUsageSchema } from './model';
import { mongodbIndexes } from './clients';

const internalToolUsageDomain = {
  commands,
  queries,
  gqlSchema: gqlInternalToolUsageSchema,
  mongodbIndexes,
};

export {
  commands,
  queries,
  gqlInternalToolUsageSchema as gqlSchema,
  mongodbIndexes,
};
export {
  InternalToolUsageEventModel,
  InternalToolUsageStatus,
} from './model';

export default internalToolUsageDomain;
