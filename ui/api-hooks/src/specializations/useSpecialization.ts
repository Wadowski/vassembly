import { useMemo } from 'react';

import { useApolloQuery } from '../graphql';

import { GET_SPECIALIZATION_QUERY } from './GET_SPECIALIZATION_QUERY';
import type { SpecializationDetailItem, UseSpecializationArgs, UseSpecializationResult } from './types';

interface GraphQLSpecializationData {
  specialization?: SpecializationDetailItem | null;
}

interface GetSpecializationVariables {
  id: string;
}

export const useSpecialization = ({
  specializationId,
  skip = false,
}: UseSpecializationArgs): UseSpecializationResult => {
  const { data, isLoading, error, refetch } = useApolloQuery<
    GraphQLSpecializationData,
    GetSpecializationVariables
  >(GET_SPECIALIZATION_QUERY, {
    variables: { id: specializationId },
    skip: skip || specializationId === '',
    withAuth: true,
  });

  const mappedData = useMemo(() => {
    if (data === undefined) {
      return undefined;
    }

    const specialization = data.specialization;
    if (specialization === null || specialization === undefined) {
      return { specialization: null };
    }

    return {
      specialization: {
        ...specialization,
        agentIds: specialization.agentIds ?? undefined,
        mcpIds: specialization.mcpIds ?? undefined,
      },
    };
  }, [data]);

  return {
    data: mappedData,
    loading: isLoading,
    error,
    refetch: () => {
      void refetch();
    },
  };
};
