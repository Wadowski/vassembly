export interface CreateTaskCommandInput {
  userId: string;
  description: string;
  agentAssignedId?: string | null;
}
