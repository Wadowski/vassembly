import { AgentStatus } from '../../constants';

export const ACTIVE_SYSTEM_AGENT_FILTER = {
  removedAt: null,
  status: AgentStatus.Active,
} as const;
