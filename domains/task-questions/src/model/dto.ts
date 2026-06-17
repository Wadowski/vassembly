import type {
  AgentType,
  AnsweredQuestion,
  BlockedInvocation,
  PendingQuestion,
  QuestionInputType,
} from './model';

export interface PendingQuestionResponse {
  questionId: string;
  invocationId: string;
  askedByAgentId: string;
  askedByAgentType: AgentType;
  question: string;
  inputType: QuestionInputType;
  options: string[] | null;
  schema: Record<string, unknown> | null;
  askedAt: string;
}

export interface AnsweredQuestionResponse {
  questionId: string;
  invocationId: string;
  askedByAgentId: string;
  askedByAgentType: AgentType;
  question: string;
  inputType: QuestionInputType;
  options: string[] | null;
  schema: Record<string, unknown> | null;
  answer: string;
  askedAt: string;
  answeredAt: string;
}

export interface TaskQuestionsResponse {
  taskId: string;
  pendingQuestions: PendingQuestionResponse[];
  answeredQuestions: AnsweredQuestionResponse[];
}

export type { PendingQuestion, AnsweredQuestion, BlockedInvocation, QuestionInputType, AgentType };
