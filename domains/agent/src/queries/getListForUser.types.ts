import type { AgentModel, AgentStatus } from '../model';

export const AGENT_LIST_ALL_STATUSES = 'all' as const;

export type AgentListStatusFilter = AgentStatus | typeof AGENT_LIST_ALL_STATUSES;

export interface GetListForUserQueryInput {
  userId: string;
  page: number;
  size: number;
  search?: string;
  status?: AgentListStatusFilter;
}

export interface GetListForUserQueryResult {
  items: AgentModel[];
  totalCount: number;
  page: number;
  size: number;
}
