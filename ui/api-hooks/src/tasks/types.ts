export enum TaskStatus {
  Created = 'created',
  InProgress = 'in-progress',
  Paused = 'paused',
  Waiting = 'waiting',
  Done = 'done',
  Failed = 'failed',
}

export enum TaskType {
  User = 'user',
  Agent = 'agent',
}

export interface TaskResponse {
  id: string;
  userId: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  agentAssignedId: string | null;
  title: string | null;
  llmResponse: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  pausedAt: string | null;
  createdAt: string;
  updatedAt: string;
  specializationIds?: string[] | null;
  skillIdsUsed?: string[] | null;
}

export interface CreateTaskBody {
  description: string;
}

export interface CreateTaskVariables {
  body: CreateTaskBody;
}

export interface TaskDto {
  id: string;
  userId: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  agentAssignedId: string | null;
  title: string | null;
  llmResponse: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  pausedAt: string | null;
  createdAt: string;
  updatedAt: string;
  specializationIds?: string[] | null;
  skillIdsUsed?: string[] | null;
}

export interface UserTasksListResponse {
  items: TaskDto[];
  totalCount: number;
  page: number;
  size: number;
}

export interface UserTasksListQuery {
  page?: number;
  size?: number;
  search?: string;
}

export interface GraphQLTaskRow {
  id?: string | null;
  userId?: string | null;
  description?: string | null;
  type?: string | null;
  status?: string | null;
  agentAssignedId?: string | null;
  title?: string | null;
  llmResponse?: string | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  pausedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  specializationIds?: string[] | null;
  skillIdsUsed?: string[] | null;
}

export interface GraphQLUserTasksListData {
  userTasks?: {
    items?: GraphQLTaskRow[] | null;
    totalCount?: number | null;
    page?: number | null;
    size?: number | null;
  } | null;
}

export interface ListUserTasksVariables {
  page?: number;
  size?: number;
  search?: string;
}

export interface GraphQLGetTaskData {
  task?: GraphQLTaskRow | null;
}

export interface GetTaskVariables {
  id: string;
}
