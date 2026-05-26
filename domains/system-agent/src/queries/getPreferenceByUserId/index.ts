import { userSystemAgentPreferenceMongodbDao } from '../../clients';
import { userSystemAgentPreferenceFactory } from '../../model';

import type { GetPreferenceByUserIdParams, GetPreferenceByUserIdResult } from './types';

export const getPreferenceByUserId = async ({
  userId,
}: GetPreferenceByUserIdParams): Promise<GetPreferenceByUserIdResult> => {
  try {
    const raw = await userSystemAgentPreferenceMongodbDao.get(
      userSystemAgentPreferenceFactory.create({ userId }),
    );

    if (!raw || raw.userId === undefined) {
      return { data: null };
    }

    return {
      data: userSystemAgentPreferenceFactory.create(raw),
    };
  } catch (error) {
    return { data: null, error };
  }
};
