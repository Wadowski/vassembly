import { Model } from '@vassembly/model';

export class TaskCommentModel extends Model {
  taskId?: string;

  userId?: string;

  userText?: string;

  agentResponse?: string | null;

  specializationIds?: string[];

  skillIdsUsed?: string[] | null;

  taskPlanInstanceId?: string | null;
}
