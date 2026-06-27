'use client';

import { useCallback } from 'react';

import { useSpecialization } from '@vassembly/ui-api-hooks';

import type { UseSpecializationDetailResult } from './types';

export const useSpecializationDetail = ({
  specializationId,
}: {
  specializationId: string;
}): UseSpecializationDetailResult => {
  const {
    data: specializationData,
    loading,
    error,
    refetch: refetchSpecialization,
  } = useSpecialization({ specializationId });

  const specialization = specializationData?.specialization;

  const isNotFound = !loading && specializationData !== undefined && specialization === null;

  const handleRetry = useCallback((): void => {
    refetchSpecialization();
  }, [refetchSpecialization]);

  return {
    specialization,
    loading,
    error,
    errorMessage: error?.message,
    isNotFound,
    handleRetry,
  };
};
