import { getDbById } from '@vassembly/queries';

import { skillMongodbDao } from '../../clients';
import { skillFactory } from '../../model';

import type { SkillModel } from '../../model';
import type { GetModelByIdParams, GetModelByIdResult } from './types';

const getModelByIdQuery = getDbById<SkillModel>({
  dao: skillMongodbDao,
  factory: skillFactory,
});

export type { GetModelByIdParams, GetModelByIdResult } from './types';

export const getModelById = async ({
  id,
}: GetModelByIdParams): Promise<GetModelByIdResult> => getModelByIdQuery({ id });
