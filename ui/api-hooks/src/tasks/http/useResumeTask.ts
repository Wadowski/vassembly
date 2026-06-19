import { CommonError, InternalError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../../http/useHttpClient';

import type { TaskResponse } from '../types';

export interface UseResumeTaskResult {
  resumeTask: (params: { id: string }) => Promise<TaskResponse>;
  isLoading: boolean;
  error: CommonError | undefined;
}

export const useResumeTask = (): UseResumeTaskResult => {
  const httpClient = useHttpClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const resumeTask = useCallback(
    async ({ id }: { id: string }): Promise<TaskResponse> => {
      setIsLoading(true);
      setError(undefined);

      try {
        return await httpClient.patch<undefined, TaskResponse>({
          path: `/tasks/${id}/resume`,
          withAuth: true,
        });
      } catch (err) {
        const nextError =
          err instanceof CommonError ? err : new InternalError('Resume task failed', err);
        setError(nextError);
        throw nextError;
      } finally {
        setIsLoading(false);
      }
    },
    [httpClient],
  );

  return { resumeTask, isLoading, error };
};
