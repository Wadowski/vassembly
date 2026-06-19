import type { INTENT_CATEGORY_SLUG } from '@vassembly/constants';
import { Model } from '@vassembly/model';

export enum TaskType {
  User = 'user',
  Agent = 'agent',
}

export enum TaskStatus {
  Created = 'created',
  InProgress = 'in-progress',
  Paused = 'paused',
  Waiting = 'waiting',
  Done = 'done',
  Failed = 'failed',
}

export class TaskModel extends Model {
  userId?: string;

  description?: string;

  type?: TaskType;

  status?: TaskStatus;

  agentAssignedId?: string | null;

  title?: string | null;

  category?: INTENT_CATEGORY_SLUG | null;

  llmResponse?: string | null;

  errorMessage?: string | null;

  errorCode?: string | null;

  startedAt?: Date | null;

  completedAt?: Date | null;

  failedAt?: Date | null;

  pausedAt?: Date | null;
}
