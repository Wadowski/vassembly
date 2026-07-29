import { Model } from '@vassembly/model';

export enum McpUsageStatus {
  Success = 'success',
  Error = 'error',
  InProgress = 'in_progress',
}

export class McpUsageEventModel extends Model {
  mcpId!: string;

  mcpSlug?: string | null;

  toolName!: string;

  toolDisplayName?: string | null;

  userId!: string;

  taskId?: string | null;

  commentId?: string | null;

  agentId!: string;

  invocationId?: string | null;

  rootInvokeId?: string | null;

  status!: McpUsageStatus;

  startedAt!: Date;

  endedAt?: Date | null;

  durationMs?: number | null;

  input?: Record<string, unknown> | null;

  inputTruncated?: boolean;

  output?: string | null;

  outputTruncated?: boolean;

  errorMessage?: string | null;
}
