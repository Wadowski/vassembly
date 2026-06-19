import { CommonError, InternalError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../../http/useHttpClient';

import type { TaskResponse } from '../types';

export interface UsePauseTaskResult {
  pauseTask: (params: { id: string }) => Promise<TaskResponse>;
  isLoading: boolean;
  error: CommonError | undefined;
}

export const usePauseTask = (): UsePauseTaskResult => {
  const httpClient = useHttpClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const pauseTask = useCallback(
    async ({ id }: { id: string }): Promise<TaskResponse> => {
      setIsLoading(true);
      setError(undefined);

      try {
        return await httpClient.patch<undefined, TaskResponse>({
          path: `/tasks/${id}/pause`,
          withAuth: true,
        });
      } catch (err) {
        const nextError =
          err instanceof CommonError ? err : new InternalError('Pause task failed', err);
        setError(nextError);
        throw nextError;
      } finally {
        setIsLoading(false);
      }
    },
    [httpClient],
  );

  return { pauseTask, isLoading, error };
};
