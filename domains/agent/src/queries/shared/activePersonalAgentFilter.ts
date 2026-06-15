import { AgentStatus } from '../../model';

export const ACTIVE_PERSONAL_AGENT_FILTER = {
  removedAt: null,
  status: AgentStatus.Active,
} as const;
