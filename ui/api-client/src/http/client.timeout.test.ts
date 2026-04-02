import { TimeoutError } from '@vassembly/errors';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createHttpClient } from './client';

describe('createHttpClient timeout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should throw TimeoutError when the request exceeds the configured timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;

          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }

          signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      }),
    );

    const client = createHttpClient({
      baseUrl: 'https://api.example.com',
      defaultTimeoutMs: 30,
    });

    await expect(client.get({ path: '/slow' })).rejects.toThrow(TimeoutError);
  });
});
