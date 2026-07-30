import { Model } from '@vassembly/model';

export enum InternalToolUsageStatus {
  Success = 'success',
  Error = 'error',
  InProgress = 'in_progress',
}

export class InternalToolUsageEventModel extends Model {
  internalToolId!: string;

  internalToolDisplayName?: string | null;

  toolName!: string;

  userId!: string;

  taskId?: string | null;

  commentId?: string | null;

  agentId!: string;

  invocationId?: string | null;

  rootInvokeId?: string | null;

  status!: InternalToolUsageStatus;

  startedAt!: Date;

  endedAt?: Date | null;

  durationMs?: number | null;

  input?: Record<string, unknown> | null;

  inputTruncated?: boolean;

  output?: string | null;

  outputTruncated?: boolean;

  errorMessage?: string | null;
}
