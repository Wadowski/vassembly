import specializationDomain from '@vassembly/domain-specialization';

import type { GetSpecializationInput, GetSpecializationResult } from './types';

export const getSpecialization = async (
  input: GetSpecializationInput,
): Promise<GetSpecializationResult> => {
  const { id } = input;

  const specializationResult = await specializationDomain.queries.getById({ id });

  return {
    specialization: specializationResult.data,
  };
};
