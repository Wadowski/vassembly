import type { ErrorDetails, TokenUsage } from './model';

export interface ProgressEventResponse {
  id: string;
  agentId: string;
  agentName?: string;
  parentAgentId?: string;
  state: string;
  timestamp: string;
  duration?: number;
  inputMessages?: string;
  generatedResponse?: string;
  tokenUsage?: TokenUsage;
  errorDetails?: ErrorDetails;
  integrationName?: string;
  provider?: string;
  model?: string;
}

export interface TaskProgressResponse {
  id: string;
  taskId: string;
  commentId: string;
  startedAt: string;
  completedAt: string | null;
  totalDuration: number;
  totalTokens: TokenUsage;
  executionAttempt: number;
  events: ProgressEventResponse[];
}
