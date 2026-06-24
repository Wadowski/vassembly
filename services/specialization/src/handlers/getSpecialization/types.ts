import type { McpListItemResponse } from '@vassembly/domain-mcp';
import type { SpecializationResponse } from '@vassembly/domain-specialization';
import type { SystemAgentAdminResponse } from '@vassembly/domain-system-agent';

export interface SpecializationAgentSummary {
  id: string;
  name: string;
  status: SystemAgentAdminResponse['status'];
}

export interface SpecializationDetailResponse extends SpecializationResponse {
  agents: SpecializationAgentSummary[];
  mcps: Pick<McpListItemResponse, 'id' | 'name' | 'slug' | 'iconPath' | 'description'>[];
}

export interface GetSpecializationInput {
  id: string;
}

export interface GetSpecializationResult {
  specialization: SpecializationDetailResponse;
}
