import { CommonError, InternalError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../../http/useHttpClient';

import type { TaskResponse } from '../types';

export interface UseRetryTaskResult {
  retryTask: (params: { id: string }) => Promise<TaskResponse>;
  isLoading: boolean;
  error: CommonError | undefined;
}

export const useRetryTask = (): UseRetryTaskResult => {
  const httpClient = useHttpClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const retryTask = useCallback(
    async ({ id }: { id: string }): Promise<TaskResponse> => {
      setIsLoading(true);
      setError(undefined);

      try {
        return await httpClient.patch<undefined, TaskResponse>({
          path: `/tasks/${id}/retry`,
          withAuth: true,
        });
      } catch (err) {
        const nextError =
          err instanceof CommonError ? err : new InternalError('Retry task failed', err);
        setError(nextError);
        throw nextError;
      } finally {
        setIsLoading(false);
      }
    },
    [httpClient],
  );

  return { retryTask, isLoading, error };
};
