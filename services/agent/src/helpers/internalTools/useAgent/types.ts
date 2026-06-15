import type { InternalToolContext } from '../types';

export interface UseAgentParams {
  args: Record<string, unknown>;
  context: InternalToolContext;
}

export interface ResolveTargetParams {
  name: string;
  context: InternalToolContext;
}

export interface ResolvedPersonalTarget {
  agentType: 'personal';
  agentId: string;
  connectionOverride: { integrationCredentialId: string };
}

export interface ResolvedSystemTarget {
  agentType: 'system';
  agentId: string;
  connectionOverride: { integrationCredentialId: string };
}

export type ResolvedTarget = ResolvedPersonalTarget | ResolvedSystemTarget;

export interface ResolveTargetError {
  error: string;
}

export type ResolveTargetResult = ResolvedTarget | ResolveTargetError;
