import type { SystemAgentAdminResponse, SystemAgentPreferenceResponse } from '@vassembly/domain-system-agent';

export enum SystemAgentCategory {
  Coding = 'coding',
  Utility = 'utility',
  Onboarding = 'onboarding',
  Compliance = 'compliance',
}

export enum SystemAgentStatus {
  Active = 'active',
  Archived = 'archived',
  Disabled = 'disabled',
}

export type { SystemAgentAdminResponse, SystemAgentPreferenceResponse };

export const SYSTEM_AGENT_LIST_ALL_STATUSES = 'all' as const;

export interface SystemAgentCatalogItem {
  id: string;
  name: string;
  description?: string;
  category?: SystemAgentCategory;
  status: SystemAgentStatus;
}

export interface SystemAgentCatalogDetail extends SystemAgentCatalogItem {
  rule: string;
}

export interface SystemAgentAdminItem extends SystemAgentCatalogDetail {
  createdByAdminId: string;
  updatedByAdminId: string;
  createdAt: string;
  updatedAt: string;
  removedAt: string | null;
}

export interface SystemAgentListResponse<TItem> {
  items: TItem[];
  page: number;
  size: number;
  total: number;
}

export type SystemAgentPreference = SystemAgentPreferenceResponse;

export interface SystemAgentInvokeUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface SystemAgentInvokeMetadata {
  model?: string;
  provider?: string;
}

export interface SystemAgentInvokeResult {
  message: string;
  usage?: SystemAgentInvokeUsage;
  metadata?: SystemAgentInvokeMetadata;
}

export interface SystemAgentFormInput {
  name: string;
  rule: string;
  description?: string;
  category?: SystemAgentCategory;
}

export interface SystemAgentAdminListQuery {
  search?: string;
  page?: number;
  size?: number;
  status?: SystemAgentStatus | typeof SYSTEM_AGENT_LIST_ALL_STATUSES;
}

export interface SystemAgentInvokeInput {
  message: string;
  connectionOverride?: {
    integrationCredentialId: string;
  };
}

export type CreateSystemAgentInput = SystemAgentFormInput;
export type UpdateSystemAgentInput = Partial<SystemAgentFormInput>;
export type ListSystemAgentsInput = SystemAgentAdminListQuery;
export type ListSystemAgentsOutput = SystemAgentListResponse<SystemAgentAdminItem>;
export type InvokeSystemAgentRequest = SystemAgentInvokeInput;
export type InvokeSystemAgentResponse = SystemAgentInvokeResult;
export type SetConnectionPreferenceInput = {
  integrationCredentialId: string;
};
