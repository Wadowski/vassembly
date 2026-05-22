import type { AgentResponseDto } from '../createAgent/types';

export interface RestoreAgentHandlerInput {
  userId: string;
  agentId: string;
}

export interface RestoreAgentHandlerOutput {
  agent: AgentResponseDto;
}
