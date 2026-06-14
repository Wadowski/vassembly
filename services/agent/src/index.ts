import * as handlers from './handlers';

export default handlers;

export type {
  CreateCredentialHandlerInput,
  CreateCredentialHandlerOutput,
} from './handlers/createCredential/types';
export { CREATE_CREDENTIAL_BODY_SCHEMA } from './handlers/createCredential/types';
