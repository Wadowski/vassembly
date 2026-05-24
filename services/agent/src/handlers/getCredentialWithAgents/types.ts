import type { AgentResponse } from '@vassembly/domain-agent';
import type { AiIntegrationCredentialResponse } from '@vassembly/domain-ai-integration';

export interface GetCredentialWithAgentsHandlerInput {
  userId: string;
  credentialId: string;
}

export interface GetCredentialWithAgentsHandlerOutput {
  credential: AiIntegrationCredentialResponse;
  agents: AgentResponse[];
}
