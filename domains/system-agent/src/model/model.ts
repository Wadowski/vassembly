import { ModelWithTranslation } from '@vassembly/model';

import { AgentCategory, AgentStatus } from '../constants';

export { AgentCategory, AgentStatus } from '../constants';

export class SystemAgentModel extends ModelWithTranslation {
  name?: string;

  description?: string;

  rule?: string;

  category?: AgentCategory;

  status?: AgentStatus;

  createdByAdminId?: string;

  updatedByAdminId?: string;

  assignedToolIds?: string[];

  specializationId?: string | null;

  customInstructions?: string | null;
}
