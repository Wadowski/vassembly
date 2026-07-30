import { useApolloClient } from '@apollo/client';
import { useCallback } from 'react';

export interface RefetchQueriesParams {
  include: string[];
}

export const useRefetchQueries = (): ((params: RefetchQueriesParams) => Promise<void>) => {
  const client = useApolloClient();

  return useCallback(
    async ({ include }: RefetchQueriesParams): Promise<void> => {
      await client.refetchQueries({ include });
    },
    [client],
  );
};
