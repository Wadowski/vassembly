import { getDbById } from '@vassembly/queries';

import { specializationMongodbDao } from '../../clients';
import { specializationFactory } from '../../model';

import type { SpecializationModel } from '../../model';
import type { GetModelByIdParams, GetModelByIdResult } from './types';

const getModelByIdQuery = getDbById<SpecializationModel>({
  dao: specializationMongodbDao,
  factory: specializationFactory,
});

export type { GetModelByIdParams, GetModelByIdResult } from './types';

export const getModelById = async ({
  id,
}: GetModelByIdParams): Promise<GetModelByIdResult> => getModelByIdQuery({ id });
