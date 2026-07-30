import { MAX_SPECIALIZATION_RESULTS } from '@vassembly/constants';
import { updateDbById } from '@vassembly/commands';
import { ValidationError } from '@vassembly/errors';
import { z } from 'zod';

import { taskCommentMongodbDao } from '../../clients';
import { TaskCommentModel, taskCommentFactory } from '../../model';

import type {
  SetSpecializationIdsCommandInput,
  SetSpecializationIdsCommandResult,
} from './types';

const SET_SPECIALIZATION_IDS_INPUT_SCHEMA = z.object({
  commentId: z.string().min(1),
  specializationIds: z.array(z.string().min(1)).max(MAX_SPECIALIZATION_RESULTS),
});

const SET_SPECIALIZATION_IDS_DB_SCHEMA = z.object({
  specializationIds: z.array(z.string().min(1)).max(MAX_SPECIALIZATION_RESULTS),
});

const persistSetSpecializationIds = updateDbById<TaskCommentModel>({
  dao: taskCommentMongodbDao,
  factory: taskCommentFactory,
  validationSchema: SET_SPECIALIZATION_IDS_DB_SCHEMA,
});

export const setSpecializationIds = async ({
  commentId,
  specializationIds,
}: SetSpecializationIdsCommandInput): Promise<SetSpecializationIdsCommandResult> => {
  const parsed = SET_SPECIALIZATION_IDS_INPUT_SCHEMA.safeParse({
    commentId,
    specializationIds,
  });

  if (!parsed.success) {
    throw new ValidationError(parsed.error.message);
  }

  return persistSetSpecializationIds({
    id: parsed.data.commentId,
    data: {
      specializationIds: parsed.data.specializationIds,
    },
  });
};
