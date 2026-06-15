import type { AgentCategory, AgentResponse } from '@vassembly/domain-agent';

export type AgentResponseDto = AgentResponse;

export interface CreateAgentHandlerInput {
  userId: string;
  body: {
    name: string;
    category: AgentCategory;
    description: string;
    rule: string;
    integrationCredentialId?: string;
    assignedMcpIds?: string[];
    assignedToolIds?: string[];
  };
}
