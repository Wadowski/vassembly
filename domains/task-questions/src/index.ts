import * as commands from './commands';
import * as queries from './queries';

import { gqlTaskQuestionsSchema } from './model';
import { mongodbIndexes } from './clients';

const taskQuestionsDomain = {
  commands,
  queries,
  gqlSchema: gqlTaskQuestionsSchema,
  mongodbIndexes,
};

export { commands, queries, gqlTaskQuestionsSchema as gqlSchema, mongodbIndexes };
export {
  TaskQuestionsModel,
  toTaskQuestionsResponse,
  type TaskQuestionsResponse,
  type PendingQuestion,
  type AnsweredQuestion,
  type BlockedInvocation,
} from './model';

export default taskQuestionsDomain;
