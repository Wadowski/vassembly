export type { TaskResponse } from '@vassembly/domain-task';

export interface CreateTaskBody {
  description: string;
}

export interface CreateTaskVariables {
  body: CreateTaskBody;
}
