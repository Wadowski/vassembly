import type { ErrorDetails, ProgressEventModel, TokenUsage } from '@vassembly/domain-task-progress';

export interface RecordTaskProgressInput {
  taskId: string;
  userId: string;
  agentId: string;
  parentAgentId?: string;
  state: 'started' | 'completed' | 'failed' | 'waiting';
  timestamp?: Date;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
  integrationName?: string;
  provider?: string;
  model?: string;
}

export type RecordTaskProgressOutput = ProgressEventModel;
