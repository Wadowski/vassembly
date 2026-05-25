export enum AgentCategory {
  Coding = 'coding',
  Personal = 'personal',
  Utility = 'utility',
}

export enum AgentStatus {
  Active = 'active',
  Archived = 'archived',
  Disabled = 'disabled',
}

export const AGENT_LIST_ALL_STATUSES = 'all' as const;

export interface AgentDto {
  id: string;
  name: string;
  category: AgentCategory;
  description: string;
  rule: string;
  userId: string;
  status: AgentStatus;
  integrationCredentialId: string | null;
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
}

export interface AgentsListResponse {
  items: AgentDto[];
  totalCount: number;
  page: number;
  size: number;
}

export interface AgentFormValues {
  name: string;
  category: AgentCategory | '';
  description: string;
  rule: string;
  integrationCredentialId: string | null;
}

export interface UseAgentFormResult {
  values: AgentFormValues;
  fieldErrors: Partial<Record<keyof AgentFormValues, string>>;
  getFieldErrorMessage: (key: keyof AgentFormValues) => string | undefined;
  descriptionCharCount: number;
  ruleCharCount: number;
  isValid: boolean;
  setField: <K extends keyof AgentFormValues>(key: K, value: AgentFormValues[K]) => void;
  blurField: (key: keyof AgentFormValues) => void;
  validate: () => boolean;
  reset: (next?: Partial<AgentFormValues>) => void;
}

export interface AgentsListQuery {
  page?: number;
  size?: number;
  search?: string;
  status?: AgentStatus | typeof AGENT_LIST_ALL_STATUSES;
}

export interface GraphQLAgentRow {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  description?: string | null;
  rule?: string | null;
  userId?: string | null;
  status?: string | null;
  integrationCredentialId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  removedAt?: string | null;
}

export interface GraphQLAgentsListData {
  agents?: {
    items?: GraphQLAgentRow[] | null;
    totalCount?: number | null;
    page?: number | null;
    size?: number | null;
  } | null;
}

export interface ListAgentsVariables {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
}
