import type { AgentCategory, AgentStatus } from '../../constants';
import type { SystemAgentModel } from '../../model';

export interface UpdateSystemAgentParams {
  id: string;
  updatedByAdminId: string;
  data: Partial<{
    name: string;
    rule: string;
    description: string | null;
    category: AgentCategory | null;
    status: AgentStatus;
    assignedToolIds: string[];
  }>;
}

export interface UpdateSystemAgentResult {
  data: SystemAgentModel;
}
