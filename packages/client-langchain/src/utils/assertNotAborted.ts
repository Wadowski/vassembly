import { ExecutionPausedError } from '@vassembly/errors';

export interface AssertNotAbortedParams {
  signal?: AbortSignal;
  shouldAbort?: () => Promise<boolean>;
}

export const assertNotAborted = async ({
  signal,
  shouldAbort,
}: AssertNotAbortedParams): Promise<void> => {
  if (signal?.aborted) {
    throw new ExecutionPausedError();
  }

  if (shouldAbort && (await shouldAbort())) {
    throw new ExecutionPausedError();
  }
};
