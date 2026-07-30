import type { ErrorDetails, TokenUsage } from '../../model';

export interface RecordProgressEventInput {
  commentId: string;
  agentId: string;
  state: 'started' | 'completed' | 'failed' | 'waiting' | 'skipped';
  timestamp?: Date;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
  parentAgentId?: string;
  integrationName?: string;
  provider?: string;
  model?: string;
  outcomeSummary?: string;
}
