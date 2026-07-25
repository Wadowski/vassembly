import type { CommonError } from '@vassembly/errors';

export interface McpListItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  slug: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseMcpsArgs {
  page?: number;
  size?: number;
  search?: string;
  tags?: string[];
  specializationId?: string;
}

export interface UseMcpCatalogResult {
  data?: {
    items: McpListItem[];
    total: number;
    page: number;
    size: number;
  };
  loading: boolean;
  error?: Error;
  execute: (args: UseMcpsArgs) => Promise<void>;
}

export type McpConfigurationStatus = 'configured' | 'pending';

export interface McpWithConfigurationStatus {
  id: string;
  name: string;
  description: string;
  tags: string[];
  iconPath: string;
  slug: string;
  documentationUrl?: string;
  repositoryUrl?: string;
  configurationStatus: McpConfigurationStatus;
  enabled: boolean;
  requiresConfiguration: boolean;
  agentUsageCount?: number;
  specializationIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface McpConfigSchemaField {
  key: string;
  label: string;
  type: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  options?: Array<{ value: string; label: string }>;
}

export interface McpDetail extends McpWithConfigurationStatus {
  configSchema?: {
    fields: McpConfigSchemaField[];
  };
}

export interface McpConfigurationFieldValue {
  key: string;
  value?: string | boolean;
  hasSecret?: boolean;
}

export interface McpConfiguration {
  id: string;
  mcpId: string;
  status: string;
  lastTestedAt?: string;
  fieldValues: McpConfigurationFieldValue[];
  createdAt: string;
  updatedAt: string;
}

export interface UserConfiguredMcpItem {
  id: string;
  mcpId: string;
  status: string;
  enabled: boolean;
  lastTestedAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface UseMcpsResult {
  data?: {
    mcps: McpWithConfigurationStatus[];
  };
  loading: boolean;
  error?: CommonError;
  refetch?: () => void;
}

export interface UseMcpResult {
  data?: {
    mcp: McpDetail | null;
  };
  loading: boolean;
  error?: CommonError;
}

export interface UseMcpConfigurationResult {
  data?: {
    configuration: McpConfiguration | null;
  };
  loading: boolean;
  error?: CommonError;
}

export interface UseUserConfiguredMcpsResult {
  data?: {
    mcps: UserConfiguredMcpItem[];
  };
  loading: boolean;
  error?: CommonError;
  refetch?: () => void;
}

export interface McpConfigurationMutationState {
  loading: boolean;
  error: CommonError | null;
}

export interface SaveConfigInput {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
}

export interface UpdateConfigInput {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
}

export interface DeleteConfigInput {
  mcpId: string;
}

export interface TestConnectionInput {
  mcpId: string;
  fieldValues: Record<string, string | boolean>;
  useSavedSecrets?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  error?: string;
}

export interface SetMcpEnabledInput {
  mcpId: string;
  enabled: boolean;
}

export interface SetMcpEnabledResponse {
  mcpId: string;
  enabled: boolean;
}

export interface SaveMcpConfigurationResponse {
  id: string;
  userId: string;
  mcpId: string;
  status: string;
  enabled: boolean;
  fieldValues: McpConfigurationFieldValue[];
  createdAt: string;
  updatedAt: string;
}

export interface McpWithAgentsAgent {
  id: string;
  name: string;
  category: string;
  status: string;
  assignedMcpIds: string[];
}

export interface McpWithAgentsData {
  mcp: {
    id: string;
    name: string;
    slug: string;
    iconPath: string;
  };
  agents: McpWithAgentsAgent[];
  totalCount: number;
  page: number;
  size: number;
  configurationStatus: McpConfigurationStatus;
  agentUsageCount: number;
}

export interface UseMcpWithAgentsResult {
  data: McpWithAgentsData | null | undefined;
  loading: boolean;
  error?: CommonError;
  refetch?: () => void;
}
