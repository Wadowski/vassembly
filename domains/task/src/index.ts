import * as commands from './commands';
import * as queries from './queries';

import { gqlTaskSchema } from './model';
import { mongodbIndexes } from './clients';

const taskDomain = {
  commands,
  queries,
  gqlSchema: gqlTaskSchema,
  mongodbIndexes,
};

export { commands, queries, gqlTaskSchema as gqlSchema, mongodbIndexes };
export { TaskType, TaskStatus, toTaskResponse } from './model';
export type { TaskModel, TaskResponse } from './model';

export default taskDomain;
