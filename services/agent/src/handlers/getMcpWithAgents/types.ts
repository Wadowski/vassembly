import type { AgentResponse } from '@vassembly/domain-agent';
import type { McpListItemResponse } from '@vassembly/domain-mcp';

export interface GetMcpWithAgentsHandlerInput {
  userId: string;
  mcpId: string;
  page?: number;
  size?: number;
}

export interface GetMcpWithAgentsHandlerOutput {
  mcp: McpListItemResponse;
  agents: AgentResponse[];
  totalCount: number;
  page: number;
  size: number;
}
