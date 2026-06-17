'use client';

import { useCreateTask } from '@vassembly/ui-api-hooks';
import { useUserAuth } from '@vassembly/ui-user-auth';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { taskSessionStorage } from '../../../lib/utils/taskSessionStorage';
import { TASK_LOGIN_RETURN_URL } from './constants';
import { getTaskErrorMessage, isUnauthorizedTaskError } from './getTaskErrorMessage';
import type { TaskSubmitResult, UseTaskInputResult } from './types';

export const useTaskInput = (): UseTaskInputResult => {
  const router = useRouter();
  const { isAuthenticated } = useUserAuth();
  const { createTask, isLoading } = useCreateTask();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clearInput = useCallback((): void => {
    setInput('');
    taskSessionStorage.clear();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const draft = taskSessionStorage.load();
    if (draft === null || draft === '') {
      return;
    }
    setInput(draft);
    taskSessionStorage.clear();
  }, [isAuthenticated]);

  const handleBlur = useCallback((): void => {
    if (isAuthenticated || input.trim() === '') {
      return;
    }
    taskSessionStorage.save(input);
  }, [input, isAuthenticated]);

  const handleSubmit = useCallback(async (): Promise<TaskSubmitResult | undefined> => {
    const description = input.trim();
    if (description === '') {
      return undefined;
    }

    setError(null);
    const outcome = await createTask({ body: { description } });

    if (outcome.ok) {
      clearInput();
      router.push(`/tasks/${outcome.task.id}`);
      return { status: 'success' };
    }

    if (isUnauthorizedTaskError(outcome.error)) {
      taskSessionStorage.save(input);
      router.push(TASK_LOGIN_RETURN_URL);
      return { status: 'unauthorized' };
    }

    const message = getTaskErrorMessage(outcome.error, 'Failed to create task');
    setError(message);
    return { status: 'error', message };
  }, [clearInput, createTask, input, router]);

  return {
    input,
    setInput,
    isLoading,
    error,
    handleSubmit,
    handleBlur,
    clearInput,
  };
};
