import type { ErrorDetails, ProgressEventModel, TokenUsage } from '@vassembly/domain-task-progress';

export interface RecordTaskProgressInput {
  taskId: string;
  userId: string;
  commentId: string;
  agentId: string;
  parentAgentId?: string;
  state: 'started' | 'completed' | 'failed' | 'waiting' | 'skipped';
  timestamp?: Date;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
  integrationName?: string;
  provider?: string;
  model?: string;
  outcomeSummary?: string;
}

export type RecordTaskProgressOutput = ProgressEventModel;
