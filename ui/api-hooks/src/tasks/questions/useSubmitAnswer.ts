import { CommonError, InternalError } from '@vassembly/errors';
import { useCallback, useState } from 'react';

import { useHttpClient } from '../../http/useHttpClient';

import type { SubmitAnswerParams, TaskQuestionsDto, UseSubmitAnswerResult } from './types';

export const useSubmitAnswer = (): UseSubmitAnswerResult => {
  const httpClient = useHttpClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonError | undefined>(undefined);

  const submitAnswer = useCallback(
    async ({ taskId, questionId, body }: SubmitAnswerParams): Promise<TaskQuestionsDto> => {
      setIsLoading(true);
      setError(undefined);

      try {
        return await httpClient.patch<typeof body, TaskQuestionsDto>({
          path: `/tasks/${taskId}/questions/${questionId}/answer`,
          body,
          withAuth: true,
        });
      } catch (err) {
        const nextError =
          err instanceof CommonError ? err : new InternalError('Submit answer failed', err);
        setError(nextError);
        throw nextError;
      } finally {
        setIsLoading(false);
      }
    },
    [httpClient],
  );

  return { submitAnswer, isLoading, error };
};
