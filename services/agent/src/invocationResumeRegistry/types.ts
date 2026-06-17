import type { AnsweredQuestion } from '@vassembly/domain-task-questions';

export interface ResumeInvocationWorkerParams {
  answeredQuestions: AnsweredQuestion[];
}

export type ResumeInvocationWorker = (
  params: ResumeInvocationWorkerParams,
) => Promise<string>;

export interface WaitForCompletionParams {
  taskId: string;
  invocationId: string;
  resume: ResumeInvocationWorker;
}

export interface ResumeInvocationParams {
  taskId: string;
  invocationId: string;
  answeredQuestions: AnsweredQuestion[];
}

export interface HasPendingParams {
  taskId: string;
  invocationId: string;
}

export interface ClearForTaskParams {
  taskId: string;
}

interface PendingInvocationEntry {
  taskId: string;
  invocationId: string;
  resume: ResumeInvocationWorker;
  resolve: (value: string) => void;
  reject: (error: unknown) => void;
}

export type PendingInvocationMap = Map<string, PendingInvocationEntry>;
