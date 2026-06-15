import type { InternalToolContext } from '../types';

export interface ListAgentsParams {
  args: Record<string, unknown>;
  context: InternalToolContext;
}

export interface ListAgentRow {
  name: string;
  description: string | undefined;
  category: string | null;
  agentType: 'personal' | 'system';
}
