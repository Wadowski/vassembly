import { taskPlanTemplateMongodbDao } from '../../clients';

import type { FindEquivalentParams, FindEquivalentResult } from './types';

export type { FindEquivalentParams, FindEquivalentResult } from './types';

export const findEquivalent = async ({
  shortName,
  normalizedDescriptionHash,
}: FindEquivalentParams): Promise<FindEquivalentResult> => {
  const byShortName = await taskPlanTemplateMongodbDao.findOne({
    shortName,
    removedAt: null,
  });

  if (byShortName) {
    return { data: byShortName };
  }

  const byHash = await taskPlanTemplateMongodbDao.findOne({
    normalizedDescriptionHash,
    removedAt: null,
  });

  return { data: byHash };
};
