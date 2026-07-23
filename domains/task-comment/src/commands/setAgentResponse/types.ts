import type { TaskCommentModel } from '../../model';

export interface SetAgentResponseCommandInput {
  commentId: string;
  agentResponse: string;
}

export interface SetAgentResponseCommandResult {
  data: TaskCommentModel;
}
