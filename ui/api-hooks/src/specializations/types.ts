import type { CommonError } from '@vassembly/errors';

import type { SystemAgentStatus } from '../systemAgents/types';

export interface SpecializationAgentItem {
  id: string;
  name: string;
  status: SystemAgentStatus;
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

export interface SpecializationDetailItem extends SpecializationListItem {}

export interface AgentsBySpecializationItem {
  id: string;
  name: string;
  description?: string | null;
  status: SystemAgentStatus;
}

export interface AgentsBySpecializationResponse {
  items: AgentsBySpecializationItem[];
  total: number;
  page: number;
  size: number;
}

export interface UseAgentsBySpecializationArgs {
  specializationId: string;
  page?: number;
  size?: number;
  search?: string;
}

export interface UseAgentsBySpecializationResult {
  data?: AgentsBySpecializationResponse;
  loading: boolean;
  error?: Error;
  execute: (args: UseAgentsBySpecializationArgs) => Promise<void>;
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
