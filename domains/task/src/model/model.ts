import { Model } from '@vassembly/model';

export enum TaskType {
  User = 'user',
  Agent = 'agent',
}

export enum TaskStatus {
  Created = 'created',
  InProgress = 'in-progress',
  Done = 'done',
}

export class TaskModel extends Model {
  userId?: string;

  description?: string;

  type?: TaskType;

  status?: TaskStatus;

  agentAssignedId?: string | null;
}
