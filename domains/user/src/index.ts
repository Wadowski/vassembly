import * as commands from "./commands";
import * as queries from "./queries";
import { gqlUserSchema as gqlSchema } from "./model";
import type { UserPublicResponse } from "./model";
import { mongodbIndexes } from "./clients";

const domainUser = {
  commands,
  queries,
  gqlSchema,
  mongodbIndexes,
};

export { commands, queries, gqlSchema, mongodbIndexes };
export type { UserPublicResponse };

export default domainUser;
