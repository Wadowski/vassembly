import { AGENT_LIST_ALL_STATUSES, AgentStatus } from '@vassembly/ui-api-hooks';

export type AgentListStatusFilter = AgentStatus | typeof AGENT_LIST_ALL_STATUSES;

export const AGENT_LIST_STATUS_OPTIONS: ReadonlyArray<{ value: AgentListStatusFilter; label: string }> = [
  { value: AGENT_LIST_ALL_STATUSES, label: 'All statuses' },
  { value: AgentStatus.Active, label: 'Active' },
  { value: AgentStatus.Archived, label: 'Archived' },
  { value: AgentStatus.Disabled, label: 'Disabled' },
];
