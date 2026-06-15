import type { ErrorDetails, TokenUsage } from '../../model';

export interface RecordProgressEventInput {
  taskId: string;
  agentId: string;
  state: 'started' | 'completed' | 'failed';
  timestamp?: Date;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
  parentAgentId?: string;
}
