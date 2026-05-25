import type { AiIntegrationCredentialResponse } from '@vassembly/domain-ai-integration';

export interface RestoreCredentialHandlerInput {
  userId: string;
  credentialId: string;
}

export interface RestoreCredentialHandlerOutput {
  credential: AiIntegrationCredentialResponse;
}
