import { taskPlanInstanceMongodbDao } from '../../clients';

import type { GetByCommentIdParams, GetByCommentIdResult } from './types';

export type { GetByCommentIdParams, GetByCommentIdResult } from './types';

export const getByCommentId = async ({
  commentId,
}: GetByCommentIdParams): Promise<GetByCommentIdResult> => {
  const instance = await taskPlanInstanceMongodbDao.findOne({ commentId });

  return { data: instance };
};
