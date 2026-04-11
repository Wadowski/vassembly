import { useState, useEffect } from 'react';
import type { CommonError } from '@vassembly/errors';
import type { UseQueryOptions, UseQueryState } from './types';

export const useFetch = <TResponse,>({
  requestFn,
  deps,
  enabled = true,
}: UseQueryOptions<TResponse>): UseQueryState<TResponse> => {
  const [data, setData] = useState<TResponse | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const refetch = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const result = await requestFn();
      setData(result);
    } catch (err) {
      setError(err as CommonError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    refetch();
  }, deps);

  return { data, isLoading, error, refetch };
};
