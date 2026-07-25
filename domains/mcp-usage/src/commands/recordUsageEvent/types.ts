import type { McpUsageStatus } from '../../model';

export interface RecordUsageEventStartedInput {
  phase: 'started';
  mcpId: string;
  mcpSlug?: string;
  toolName: string;
  userId: string;
  taskId?: string | null;
  commentId?: string | null;
  agentId: string;
  invocationId?: string;
  rootInvokeId?: string;
  startedAt: Date;
  input?: Record<string, unknown>;
}

export interface RecordUsageEventCompletedInput {
  phase: 'completed';
  eventId: string;
  status: Extract<McpUsageStatus, 'success' | 'error'>;
  endedAt: Date;
  durationMs: number;
  errorMessage?: string;
}

export type RecordUsageEventInput =
  | RecordUsageEventStartedInput
  | RecordUsageEventCompletedInput;

export interface RecordUsageEventStartedResult {
  eventId: string;
}

export type RecordUsageEventResult = RecordUsageEventStartedResult | void;
