import type { InternalToolUsageStatus } from '../../model';

export interface RecordUsageEventStartedInput {
  phase: 'started';
  internalToolId: string;
  internalToolDisplayName?: string;
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
  status: Extract<InternalToolUsageStatus, 'success' | 'error'>;
  endedAt: Date;
  durationMs: number;
  errorMessage?: string;
  output?: string;
}

export type RecordUsageEventInput =
  | RecordUsageEventStartedInput
  | RecordUsageEventCompletedInput;

export interface RecordUsageEventStartedResult {
  eventId: string;
}

export type RecordUsageEventResult = RecordUsageEventStartedResult | void;
