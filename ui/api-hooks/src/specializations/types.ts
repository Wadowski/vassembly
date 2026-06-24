import type { CommonError } from '@vassembly/errors';

export interface SpecializationAgentItem {
  id: string;
  name: string;
  status: string;
}

export interface SpecializationMcpItem {
  id: string;
  name: string;
  slug: string;
  iconPath?: string;
  description?: string;
}

export interface SpecializationListItem {
  id: string;
  name: string;
  description: string;
  agentIds?: string[];
  mcpIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SpecializationDetailItem extends SpecializationListItem {
  agents?: SpecializationAgentItem[];
  mcps?: SpecializationMcpItem[];
}

export interface SpecializationsListResponse {
  items: SpecializationListItem[];
  total: number;
  page: number;
  size: number;
}

export interface UseSpecializationsArgs {
  page?: number;
  size?: number;
  search?: string;
}

export interface UseSpecializationsResult {
  data?: SpecializationsListResponse;
  loading: boolean;
  error?: Error;
  execute: (args?: UseSpecializationsArgs) => Promise<void>;
}

export interface LinkedSpecializationItem {
  id: string;
  name: string;
}

export interface UseLinkedSpecializationsArgs {
  ids: string[];
}

export interface UseLinkedSpecializationsResult {
  specializations: LinkedSpecializationItem[];
  loading: boolean;
}

export interface UseSpecializationArgs {
  specializationId: string;
  skip?: boolean;
}

export interface UseSpecializationResult {
  data?: {
    specialization: SpecializationDetailItem | null;
  };
  loading: boolean;
  error?: CommonError;
  refetch: () => void;
}
