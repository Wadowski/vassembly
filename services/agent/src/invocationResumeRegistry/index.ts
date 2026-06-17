import { makeRegistryKey } from './makeRegistryKey';

import type {
  ClearForTaskParams,
  HasPendingParams,
  PendingInvocationMap,
  ResumeInvocationParams,
  WaitForCompletionParams,
} from './types';

const pendingInvocations: PendingInvocationMap = new Map();

export const invocationResumeRegistry = {
  waitForCompletion: ({
    taskId,
    invocationId,
    resume,
  }: WaitForCompletionParams): Promise<string> => {
    const key = makeRegistryKey({ taskId, invocationId });

    return new Promise((resolve, reject) => {
      pendingInvocations.set(key, {
        taskId,
        invocationId,
        resume,
        resolve,
        reject,
      });
    });
  },

  hasPending: ({ taskId, invocationId }: HasPendingParams): boolean => {
    const key = makeRegistryKey({ taskId, invocationId });
    return pendingInvocations.has(key);
  },

  resumeInvocation: async ({
    taskId,
    invocationId,
    answeredQuestions,
  }: ResumeInvocationParams): Promise<boolean> => {
    const key = makeRegistryKey({ taskId, invocationId });
    const pending = pendingInvocations.get(key);

    if (!pending) {
      return false;
    }

    try {
      const result = await pending.resume({ answeredQuestions });
      pending.resolve(result);
      return true;
    } catch (error) {
      pending.reject(error);
      throw error;
    } finally {
      pendingInvocations.delete(key);
    }
  },

  clearForTask: ({ taskId }: ClearForTaskParams): void => {
    for (const [key, pending] of pendingInvocations.entries()) {
      if (pending.taskId !== taskId) {
        continue;
      }

      pending.reject(new Error('Invocation resume cleared for task'));
      pendingInvocations.delete(key);
    }
  },
};
