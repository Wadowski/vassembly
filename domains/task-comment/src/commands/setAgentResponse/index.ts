import { updateDbById } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskCommentMongodbDao } from '../../clients';
import { TaskCommentModel, taskCommentFactory } from '../../model';

import type { SetAgentResponseCommandInput, SetAgentResponseCommandResult } from './types';

const SET_AGENT_RESPONSE_INPUT_SCHEMA = z
  .object({
    commentId: z.string().min(1),
    agentResponse: z.string().max(5000, 'Response exceeds 5000 characters').optional(),
    skillIdsUsed: z.array(z.string().min(1)).nullable().optional(),
    taskPlanInstanceId: z.string().min(1).nullable().optional(),
  })
  .refine(
    (data) =>
      data.agentResponse !== undefined ||
      data.taskPlanInstanceId !== undefined ||
      data.skillIdsUsed !== undefined,
    { message: 'At least one field must be provided' },
  );

const SET_AGENT_RESPONSE_DB_SCHEMA = z.object({
  agentResponse: z.string().max(5000).optional(),
  skillIdsUsed: z.array(z.string().min(1)).nullable().optional(),
  taskPlanInstanceId: z.string().min(1).nullable().optional(),
});

const persistSetAgentResponse = updateDbById<TaskCommentModel>({
  dao: taskCommentMongodbDao,
  factory: taskCommentFactory,
  validationSchema: SET_AGENT_RESPONSE_DB_SCHEMA,
});

export const setAgentResponse = async ({
  commentId,
  agentResponse,
  skillIdsUsed,
  taskPlanInstanceId,
}: SetAgentResponseCommandInput): Promise<SetAgentResponseCommandResult> => {
  const parsed = SET_AGENT_RESPONSE_INPUT_SCHEMA.safeParse({
    commentId,
    agentResponse,
    skillIdsUsed,
    taskPlanInstanceId,
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  const data: Partial<
    Pick<TaskCommentModel, 'agentResponse' | 'skillIdsUsed' | 'taskPlanInstanceId'>
  > = {};

  if (parsed.data.agentResponse !== undefined) {
    data.agentResponse = parsed.data.agentResponse;
  }

  if (parsed.data.skillIdsUsed !== undefined) {
    data.skillIdsUsed = parsed.data.skillIdsUsed;
  }

  if (parsed.data.taskPlanInstanceId !== undefined) {
    data.taskPlanInstanceId = parsed.data.taskPlanInstanceId;
  }

  const result = await persistSetAgentResponse({
    id: parsed.data.commentId,
    data,
  });

  if (result.data) {
    if (parsed.data.skillIdsUsed !== undefined) {
      result.data.skillIdsUsed = parsed.data.skillIdsUsed ?? result.data.skillIdsUsed;
    }

    if (parsed.data.taskPlanInstanceId !== undefined) {
      result.data.taskPlanInstanceId =
        parsed.data.taskPlanInstanceId ?? result.data.taskPlanInstanceId;
    }
  }

  return result;
};
