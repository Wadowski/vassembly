import * as commands from './commands';
import * as queries from './queries';

export { normalizeDescriptionHash } from './queries/shared/normalizeDescriptionHash';

const domain = {
  commands,
  queries,
};

export default domain;
