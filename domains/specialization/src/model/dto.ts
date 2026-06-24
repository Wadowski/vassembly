export interface SpecializationResponse {
  id: string;
  name: string;
  description: string;
  agentIds?: string[];
  mcpIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SpecializationPageResponse {
  items: SpecializationResponse[];
  page: number;
  size: number;
  total: number;
}
