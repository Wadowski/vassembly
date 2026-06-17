import { describe, it, expect } from 'vitest';
import { ExecutionPausedError } from '@vassembly/errors';

import { assertNotAborted } from './assertNotAborted';

describe('assertNotAborted', () => {
  it('should throw ExecutionPausedError when signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      assertNotAborted({ signal: controller.signal }),
    ).rejects.toThrow(ExecutionPausedError);
  });

  it('should throw ExecutionPausedError when shouldAbort returns true', async () => {
    await expect(
      assertNotAborted({
        shouldAbort: async () => true,
      }),
    ).rejects.toThrow(ExecutionPausedError);
  });

  it('should resolve when signal is not aborted and shouldAbort returns false', async () => {
    const controller = new AbortController();

    await expect(
      assertNotAborted({
        signal: controller.signal,
        shouldAbort: async () => false,
      }),
    ).resolves.toBeUndefined();
  });
});
