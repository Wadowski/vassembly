import type { TaskCommentModel } from '../../model';

export interface SetAgentResponseCommandInput {
  commentId: string;
  agentResponse?: string;
  skillIdsUsed?: string[] | null;
  taskPlanInstanceId?: string | null;
}

export interface SetAgentResponseCommandResult {
  data: TaskCommentModel;
}
