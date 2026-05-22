import type { AgentListStatusFilter } from '@vassembly/domain-agent';

export interface ListAgentsHandlerInput {
  userId: string;
  page: number;
  size: number;
  search?: string;
  status?: AgentListStatusFilter;
}

export interface ListAgentsHandlerOutput {
  items: unknown[];
  totalCount: number;
  page: number;
  size: number;
}
