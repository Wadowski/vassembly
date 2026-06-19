import * as commands from './commands';
import * as queries from './queries';

import { gqlTaskProgressSchema } from './model';
import { mongodbIndexes } from './clients';

const taskProgressDomain = {
  commands,
  queries,
  gqlSchema: gqlTaskProgressSchema,
  mongodbIndexes,
};

export { commands, queries, gqlTaskProgressSchema as gqlSchema, mongodbIndexes };
export { TaskProgressModel, ProgressEventState, toTaskProgressResponse } from './model';
export type { ProgressEventModel, TokenUsage, ErrorDetails, TaskProgressResponse, ProgressEventResponse } from './model';

export default taskProgressDomain;
