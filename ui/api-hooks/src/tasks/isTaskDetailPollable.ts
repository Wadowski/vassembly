import { TaskStatus } from './types';

export const TASK_QUESTIONS_POLL_INTERVAL_MS = 2000;

export const isTaskDetailPollable = (status: TaskStatus): boolean =>
  status === TaskStatus.InProgress || status === TaskStatus.Waiting;
