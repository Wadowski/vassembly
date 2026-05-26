export interface TaskResponse {
  id: string;
  userId: string;
  description: string;
  type: 'user' | 'agent';
  status: 'created' | 'in-progress' | 'done';
  agentAssignedId: string | null;
  createdAt: string;
  updatedAt: string;
}
