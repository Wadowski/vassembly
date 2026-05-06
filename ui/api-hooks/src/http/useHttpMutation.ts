import { CommonError, InternalError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import type { OperationVariables } from '@apollo/client';
import type { UseApolloMutationState } from '../graphql/types';
import { useHttpClient } from './useHttpClient';

type HttpMutationMethod = 'post' | 'patch' | 'put' | 'delete';

export interface UseHttpMutationConfig<
  TData,
  TVariables extends OperationVariables,
  TBody,
  THttpResponse,
> {
  path: string;
  method?: HttpMutationMethod;
  withAuth?: boolean;
  query?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  mapVariablesToBody: (variables: TVariables | undefined) => TBody | undefined;
  mapResponse: (response: THttpResponse) => TData;
  internalErrorMessage: string;
}

export const useHttpMutation = <
  TData,
  TVariables extends OperationVariables = OperationVariables,
  TBody = unknown,
  THttpResponse = unknown,
>(
  config: UseHttpMutationConfig<TData, TVariables, TBody, THttpResponse>,
): UseApolloMutationState<TData, TVariables> => {
  const httpClient = useHttpClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);
  const [data, setData] = useState<TData | undefined>(undefined);

  const reset = useCallback((): void => {
    setData(undefined);
    setError(undefined);
  }, []);

  const mutate = useCallback(
    async (variables?: TVariables): Promise<TData | undefined> => {
      const body = config.mapVariablesToBody(variables);

      if (body === undefined) {
        return undefined;
      }

      setIsLoading(true);
      setError(undefined);

      try {
        const method = config.method ?? 'post';
        const requestOptions = {
          path: config.path,
          body,
          ...(config.withAuth !== undefined && { withAuth: config.withAuth }),
          ...(config.query && { query: config.query }),
          ...(config.headers && { headers: config.headers }),
        };

        let response: THttpResponse;
        if (method === 'post') {
          response = await httpClient.post<TBody, THttpResponse>(requestOptions);
        } else if (method === 'patch') {
          response = await httpClient.patch<TBody, THttpResponse>(requestOptions);
        } else if (method === 'put') {
          response = await httpClient.put<TBody, THttpResponse>(requestOptions);
        } else if (method === 'delete') {
          response = await httpClient.delete<THttpResponse>(requestOptions as any);
        } else {
          throw new Error(`Unsupported HTTP method: ${method}`);
        }

        const nextData = config.mapResponse(response);
        setData(nextData);
        return nextData;
      } catch (err) {
        const nextError =
          err instanceof CommonError ? err : new InternalError(config.internalErrorMessage, err);
        setError(nextError);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [httpClient],
  );

  return {
    mutate,
    isLoading,
    error,
    data,
    reset,
  };
};
