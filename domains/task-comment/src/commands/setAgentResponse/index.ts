import { updateDbById } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskCommentMongodbDao } from '../../clients';
import { TaskCommentModel, taskCommentFactory } from '../../model';

import type { SetAgentResponseCommandInput, SetAgentResponseCommandResult } from './types';

const SET_AGENT_RESPONSE_INPUT_SCHEMA = z.object({
  commentId: z.string().min(1),
  agentResponse: z.string().max(5000, 'Response exceeds 5000 characters'),
});

const SET_AGENT_RESPONSE_DB_SCHEMA = z.object({
  agentResponse: z.string().max(5000),
});

const persistSetAgentResponse = updateDbById<TaskCommentModel>({
  dao: taskCommentMongodbDao,
  factory: taskCommentFactory,
  validationSchema: SET_AGENT_RESPONSE_DB_SCHEMA,
});

export const setAgentResponse = async ({
  commentId,
  agentResponse,
}: SetAgentResponseCommandInput): Promise<SetAgentResponseCommandResult> => {
  const parsed = SET_AGENT_RESPONSE_INPUT_SCHEMA.safeParse({ commentId, agentResponse });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  return persistSetAgentResponse({
    id: parsed.data.commentId,
    data: {
      agentResponse: parsed.data.agentResponse,
    },
  });
};
