import { useCallback, useMemo } from 'react';

import { useApolloLazyQuery } from '../../graphql';
import { mapAiIntegrationsListData } from '../mappers';
import type {
  AiIntegrationsListResponse,
  GraphQLAiIntegrationsListData,
  ListAiIntegrationsVariables,
} from '../types';

import { LIST_AI_INTEGRATIONS_QUERY } from './listAiIntegrationsQuery';

export const useAiIntegrations = () => {
  const { execute, data: graphQLData, isLoading, error } = useApolloLazyQuery<
    GraphQLAiIntegrationsListData,
    ListAiIntegrationsVariables
  >(LIST_AI_INTEGRATIONS_QUERY, {
    fetchPolicy: 'no-cache',
    withAuth: true,
  });

  const data = useMemo(() => mapAiIntegrationsListData(graphQLData), [graphQLData]);

  const fetch = useCallback(
    async (variables?: ListAiIntegrationsVariables): Promise<AiIntegrationsListResponse | undefined> => {
      const result = await execute(variables);
      return mapAiIntegrationsListData(result.data);
    },
    [execute],
  );

  return { data, isLoading, error, fetch };
};
