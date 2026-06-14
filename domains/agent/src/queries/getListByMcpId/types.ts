import type { AgentModel } from '../../model';

export interface GetListByMcpIdInput {
  userId: string;
  mcpId: string;
  page?: number;
  size?: number;
}

export interface GetListByMcpIdResult {
  items: AgentModel[];
  totalCount: number;
  page: number;
  size: number;
}
