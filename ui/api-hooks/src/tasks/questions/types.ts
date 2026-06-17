import type { CommonError } from '@vassembly/errors';

import type { TaskStatus } from '../types';

export type QuestionInputType = 'text' | 'select' | 'multiselect' | 'boolean';

export interface PendingQuestionDto {
  questionId: string;
  invocationId: string;
  askedByAgentId: string;
  askedByAgentType: string;
  question: string;
  inputType: QuestionInputType;
  options: string[] | null;
  askedAt: string;
}

export interface AnsweredQuestionDto {
  questionId: string;
  invocationId: string;
  askedByAgentId: string;
  askedByAgentType: string;
  question: string;
  inputType: QuestionInputType;
  options: string[] | null;
  answer: string;
  askedAt: string;
  answeredAt: string;
}

export interface TaskQuestionsDto {
  taskId: string;
  pendingQuestions: PendingQuestionDto[];
  answeredQuestions: AnsweredQuestionDto[];
}

export interface GraphQLPendingQuestionRow {
  questionId?: string | null;
  invocationId?: string | null;
  askedByAgentId?: string | null;
  askedByAgentType?: string | null;
  question?: string | null;
  inputType?: string | null;
  options?: string[] | null;
  askedAt?: string | null;
}

export interface GraphQLAnsweredQuestionRow extends GraphQLPendingQuestionRow {
  answer?: string | null;
  answeredAt?: string | null;
}

export interface GraphQLTaskQuestionsData {
  taskQuestions?: {
    taskId?: string | null;
    pendingQuestions?: GraphQLPendingQuestionRow[] | null;
    answeredQuestions?: GraphQLAnsweredQuestionRow[] | null;
  } | null;
}

export interface GetTaskQuestionsVariables {
  taskId: string;
}

export interface SubmitAnswerBody {
  answer: string | string[] | boolean;
}

export interface SubmitAnswerParams {
  taskId: string;
  questionId: string;
  body: SubmitAnswerBody;
}

export interface UseTaskQuestionsParams {
  taskId: string;
  taskStatus: TaskStatus;
}

export interface UseSubmitAnswerResult {
  submitAnswer: (params: SubmitAnswerParams) => Promise<TaskQuestionsDto>;
  isLoading: boolean;
  error: CommonError | undefined;
}
