import { CommonError, InternalError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../http/useHttpClient';

import type { CreateTaskBody, CreateTaskVariables, TaskResponse } from './types';

export type CreateTaskOutcome =
  | { ok: true; task: TaskResponse }
  | { ok: false; error: CommonError };

export interface UseCreateTaskResult {
  createTask: (variables: CreateTaskVariables) => Promise<CreateTaskOutcome>;
  isLoading: boolean;
  error: CommonError | undefined;
}

export const useCreateTask = (): UseCreateTaskResult => {
  const httpClient = useHttpClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const createTask = useCallback(
    async (variables: CreateTaskVariables): Promise<CreateTaskOutcome> => {
      setIsLoading(true);
      setError(undefined);

      try {
        const task = await httpClient.post<CreateTaskBody, TaskResponse>({
          path: '/tasks',
          withAuth: true,
          body: variables.body,
        });
        return { ok: true, task };
      } catch (err) {
        const nextError =
          err instanceof CommonError ? err : new InternalError('Create task failed', err);
        setError(nextError);
        return { ok: false, error: nextError };
      } finally {
        setIsLoading(false);
      }
    },
    [httpClient],
  );

  return { createTask, isLoading, error };
};
