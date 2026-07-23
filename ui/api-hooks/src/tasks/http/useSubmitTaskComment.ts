import { CommonError, InternalError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../../http/useHttpClient';

import type { TaskDto } from '../types';

export interface SubmitTaskCommentBody {
  userText: string;
}

export interface SubmitTaskCommentResponse {
  comment: {
    id: string;
    taskId: string;
    userId: string;
    userText: string;
    agentResponse: string | null;
    createdAt: string;
    updatedAt: string;
  };
  task: TaskDto;
}

export const useSubmitTaskComment = (): {
  submit: (params: { taskId: string; userText: string }) => Promise<SubmitTaskCommentResponse>;
  isLoading: boolean;
  error: CommonError | undefined;
} => {
  const httpClient = useHttpClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const submit = useCallback(
    async ({
      taskId,
      userText,
    }: {
      taskId: string;
      userText: string;
    }): Promise<SubmitTaskCommentResponse> => {
      setIsLoading(true);
      setError(undefined);

      try {
        return await httpClient.post<SubmitTaskCommentBody, SubmitTaskCommentResponse>({
          path: `/tasks/${taskId}/comments`,
          body: { userText },
          withAuth: true,
        });
      } catch (err) {
        const nextError =
          err instanceof CommonError ? err : new InternalError('Submit comment failed', err);
        setError(nextError);
        throw nextError;
      } finally {
        setIsLoading(false);
      }
    },
    [httpClient],
  );

  return { submit, isLoading, error };
};
