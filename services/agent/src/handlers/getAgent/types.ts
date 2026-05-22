import type { AgentResponseDto } from '../createAgent/types';

export interface GetAgentHandlerInput {
  userId: string;
  agentId: string;
}

export interface GetAgentHandlerOutput {
  agent: AgentResponseDto;
}
