import type { AgentCategory } from '../../constants';
import type { SystemAgentModel } from '../../model';

export interface CreateSystemAgentParams {
  name: string;
  rule: string;
  description?: string;
  category?: AgentCategory;
  createdByAdminId: string;
  updatedByAdminId?: string;
}

export interface CreateSystemAgentResult {
  data: SystemAgentModel;
}
