import { useState, useEffect } from 'react';
import type { CommonError } from '@vassembly/errors';
import type { UseQueryOptions, UseQueryState } from './types';

export const useFetch = <TResponse, TParams>({
  requestFn,
}: UseQueryOptions<TResponse, TParams>): UseQueryState<TResponse, TParams> => {
  const [data, setData] = useState<TResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const fetch: UseQueryState<TResponse, TParams>['fetch'] = async ({ body, query }) => {
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
  };

  return { data, isLoading, error, fetch };
};
