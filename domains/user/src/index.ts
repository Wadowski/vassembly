import * as commands from "./commands";
import * as queries from "./queries";
import { gqlUserSchema } from "./model";

const user = {
  commands,
  queries,
  gqlSchema: gqlUserSchema,
};

export default user;
