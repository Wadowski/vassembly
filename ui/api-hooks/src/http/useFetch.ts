import { useCallback, useState } from 'react';
import type { CommonError } from '@vassembly/errors';
import type { UseQueryFetchOptions, UseQueryOptions, UseQueryState } from './types';

export const useFetch = <TResponse, TBody = never, TQuery = Record<string, string | number | boolean>>({
  requestFn,
}: UseQueryOptions<TResponse, TBody, TQuery>): UseQueryState<TResponse, TBody, TQuery> => {
  const [data, setData] = useState<TResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const fetch = useCallback(
    async ({ body, query }: UseQueryFetchOptions<TBody, TQuery>) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const result = await requestFn({ body, query });
        setData(result);
      } catch (err) {
        setError(err as CommonError);
      } finally {
        setIsLoading(false);
      }
    },
    [requestFn],
  );

  return { data, isLoading, error, fetch };
};
