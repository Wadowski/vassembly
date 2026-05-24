import type { AiIntegrationCredentialResponse } from '@vassembly/domain-ai-integration';

export interface GetCredentialHandlerInput {
  userId: string;
  credentialId: string;
}

export interface GetCredentialHandlerOutput {
  credential: AiIntegrationCredentialResponse;
}
