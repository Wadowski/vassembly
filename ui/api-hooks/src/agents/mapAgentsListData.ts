import { AgentCategory, AgentStatus } from './types';
import type { AgentDto, AgentsListResponse, GraphQLAgentRow, GraphQLAgentsListData } from './types';

const toIsoString = (value: string | null | undefined): string => value ?? '';

const toAgentCategory = (value: string | null | undefined): AgentCategory => {
  const categories = Object.values(AgentCategory) as string[];
  if (value && categories.includes(value)) {
    return value as AgentCategory;
  }
  return AgentCategory.Coding;
};

const toAgentStatus = (value: string | null | undefined): AgentStatus => {
  const statuses = Object.values(AgentStatus) as string[];
  if (value && statuses.includes(value)) {
    return value as AgentStatus;
  }
  return AgentStatus.Active;
};

const toAgentDto = (row: GraphQLAgentRow): AgentDto => ({
  id: row.id ?? '',
  name: row.name ?? '',
  category: toAgentCategory(row.category),
  description: row.description ?? '',
  rule: row.rule ?? '',
  userId: row.userId ?? '',
  status: toAgentStatus(row.status),
  integrationCredentialId: row.integrationCredentialId ?? null,
  assignedMcpIds: row.assignedMcpIds ?? [],
  createdAt: toIsoString(row.createdAt),
  updatedAt: toIsoString(row.updatedAt),
  removedAt: row.removedAt ?? null,
});

export const mapAgentsListData = (data: GraphQLAgentsListData | undefined): AgentsListResponse | undefined => {
  const list = data?.agents;
  if (!list) {
    return undefined;
  }

  return {
    items: (list.items ?? []).map(toAgentDto),
    totalCount: list.totalCount ?? 0,
    page: list.page ?? 0,
    size: list.size ?? 0,
  };
};
