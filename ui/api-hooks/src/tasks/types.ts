export enum TaskStatus {
  Created = 'created',
  InProgress = 'in-progress',
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt?: string | null;
  updatedAt?: string | null;
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
