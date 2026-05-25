import type { AgentCategory, AgentStatus } from '@vassembly/domain-agent';

import type { AgentResponseDto } from '../createAgent/types';

export interface UpdateAgentHandlerInput {
  userId: string;
  agentId: string;
  patch: Partial<{
    name: string;
    category: AgentCategory;
    description: string;
    rule: string;
    status: AgentStatus;
    integrationCredentialId: string;
  }>;
}

export interface UpdateAgentHandlerOutput {
  agent: AgentResponseDto;
}
