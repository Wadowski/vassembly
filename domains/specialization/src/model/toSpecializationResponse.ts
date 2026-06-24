import { assertRequiredFields, toIsoString } from '@vassembly/mappers';

import type { SpecializationResponse } from './dto';
import type { SpecializationModel } from './model';

const REQUIRED_FIELDS = ['id', 'name', 'description', 'createdAt', 'updatedAt'] as const;

export interface ToSpecializationResponseParams {
  specialization: SpecializationModel;
}

export const toSpecializationResponse = ({
  specialization,
}: ToSpecializationResponseParams): SpecializationResponse => {
  assertRequiredFields({
    entity: specialization,
    fields: REQUIRED_FIELDS,
    entityName: 'Specialization',
  });

  return {
    id: specialization.id!,
    name: specialization.name!,
    description: specialization.description!,
    createdAt: toIsoString({ value: specialization.createdAt!, fieldName: 'createdAt' }),
    updatedAt: toIsoString({ value: specialization.updatedAt!, fieldName: 'updatedAt' }),
  };
};
