import { Model } from '@vassembly/model';

export enum ProgressEventState {
  Started = 'started',
  Completed = 'completed',
  Failed = 'failed',
  Waiting = 'waiting',
  Skipped = 'skipped',
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface ErrorDetails {
  message: string;
  type?: string;
  stackTrace?: string;
}

export interface ProgressEventModel {
  id: string;
  agentId: string;
  state: ProgressEventState;
  timestamp: Date;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
  parentAgentId?: string;
  childAgentIds?: string[];
  integrationName?: string;
  provider?: string;
  model?: string;
  outcomeSummary?: string;
}

export class TaskProgressModel extends Model {
  taskId?: string;

  commentId?: string;

  userId?: string;

  startedAt?: Date;

  completedAt?: Date | null;

  events?: ProgressEventModel[];

  totalDuration?: number;

  totalTokens?: TokenUsage;

  executionAttempt?: number;
}
