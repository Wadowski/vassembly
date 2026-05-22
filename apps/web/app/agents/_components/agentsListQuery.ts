import type { AgentsListQuery } from '@vassembly/ui-api-hooks';

import type { AgentListStatusFilter } from './agentListTypes';

export const AGENT_LIST_PAGE_SIZE = 10;

export interface AgentsListFiltersState {
  page: number;
  searchTrimmed: string;
  status?: AgentListStatusFilter;
}

export const toAgentsListQuery = (state: AgentsListFiltersState): AgentsListQuery => ({
  page: state.page,
  size: AGENT_LIST_PAGE_SIZE,
  ...(state.searchTrimmed !== '' ? { search: state.searchTrimmed } : {}),
  ...(state.status !== undefined ? { status: state.status } : {}),
});
