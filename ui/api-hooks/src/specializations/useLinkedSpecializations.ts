import { useMemo } from 'react';

import { useSpecialization } from './useSpecialization';
import type { UseLinkedSpecializationsArgs, UseLinkedSpecializationsResult } from './types';

const MAX_LINKED_SPECIALIZATIONS = 3;

export const useLinkedSpecializations = ({
  ids,
}: UseLinkedSpecializationsArgs): UseLinkedSpecializationsResult => {
  const normalizedIds = useMemo(
    () => ids.filter((id) => id.trim() !== '').slice(0, MAX_LINKED_SPECIALIZATIONS),
    [ids],
  );

  const id0 = normalizedIds[0] ?? '';
  const id1 = normalizedIds[1] ?? '';
  const id2 = normalizedIds[2] ?? '';

  const result0 = useSpecialization({ specializationId: id0 });
  const result1 = useSpecialization({ specializationId: id1 });
  const result2 = useSpecialization({ specializationId: id2 });

  const results = [result0, result1, result2];

  const specializations = useMemo((): UseLinkedSpecializationsResult['specializations'] => {
    return normalizedIds.flatMap((id, index) => {
      const specialization = results[index]?.data?.specialization;

      if (specialization === undefined || specialization === null) {
        return [];
      }

      return [{ id, name: specialization.name }];
    });
  }, [normalizedIds, result0.data, result1.data, result2.data]);

  const loading = normalizedIds.some((id, index) => id !== '' && results[index]?.loading === true);

  return {
    specializations,
    loading,
  };
};
