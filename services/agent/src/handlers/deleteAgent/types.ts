export interface DeleteAgentHandlerInput {
  userId: string;
  agentId: string;
}

export interface DeleteAgentHandlerOutput {
  success: boolean;
  message: string;
}
