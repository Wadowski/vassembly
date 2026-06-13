import type { AgentResponse } from '@vassembly/domain-agent';

export interface UnassignMcpFromAgentHandlerInput {
  userId: string;
  mcpId: string;
  agentId: string;
}

export interface UnassignMcpFromAgentHandlerOutput {
  agent: AgentResponse;
}
