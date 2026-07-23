import { Model } from '@vassembly/model';

export type QuestionInputType = 'text' | 'select' | 'multiselect' | 'boolean';

export type AgentType = 'personal' | 'system';

export interface PendingQuestion {
  questionId: string;
  commentId: string;
  invocationId: string;
  askedByAgentId: string;
  askedByAgentType: AgentType;
  question: string;
  inputType: QuestionInputType;
  options?: string[];
  schema?: Record<string, unknown>;
  askedAt: Date;
}

export interface AnsweredQuestion extends PendingQuestion {
  answer: string | string[] | boolean;
  answeredAt: Date;
}

export interface InvocationResumeCheckpoint {
  messageHistory?: unknown[];
  progressEventIds?: string[];
}

export interface BlockedInvocation {
  invocationId: string;
  agentId: string;
  agentType: AgentType;
  blockedAt: Date;
  resumeCheckpoint?: InvocationResumeCheckpoint;
}

export class TaskQuestionsModel extends Model {
  taskId?: string;

  pendingQuestions?: PendingQuestion[];

  answeredQuestions?: AnsweredQuestion[];

  blockedInvocations?: BlockedInvocation[];
}
