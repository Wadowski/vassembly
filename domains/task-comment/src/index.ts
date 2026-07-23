import * as commands from './commands';
import * as queries from './queries';

import { gqlTaskCommentSchema } from './model';
import { mongodbIndexes } from './clients';

const taskCommentDomain = {
  commands,
  queries,
  gqlSchema: gqlTaskCommentSchema,
  mongodbIndexes,
};

export { commands, queries, gqlTaskCommentSchema as gqlSchema, mongodbIndexes };
export { TaskCommentModel, toTaskCommentResponse } from './model';
export type { TaskCommentResponse } from './model';

export default taskCommentDomain;
