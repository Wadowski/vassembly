import { InternalError, NotFoundError } from '@vassembly/errors';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchResponse } from '../test/mockFetchResponse';
import { executeRequest } from './executeRequest';

const baseConfig = { baseUrl: 'https://api.example.com' };

describe('executeRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return parsed JSON when the response is ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: true,
          status: 200,
          bodyText: JSON.stringify({ id: 1 }),
        }),
      ),
    );

    const data = await executeRequest<undefined, { id: number }>({
      config: baseConfig,
      method: 'GET',
      options: { path: '/x' },
    });

    expect(data).toEqual({ id: 1 });
  });

  it('should throw mapped CommonError when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: false,
          status: 404,
          bodyText: JSON.stringify({ message: 'Missing' }),
        }),
      ),
    );

    await expect(
      executeRequest({
        config: baseConfig,
        method: 'GET',
        options: { path: '/y' },
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw InternalError when getAuthToken rejects', async () => {
    vi.stubGlobal('fetch', vi.fn());

    await expect(
      executeRequest({
        config: {
          ...baseConfig,
          getAuthToken: async () => {
            throw new Error('auth down');
          },
        },
        method: 'GET',
        options: { path: '/z' },
      }),
    ).rejects.toThrow(InternalError);
  });

  it('should throw InternalError when response body is not valid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: true,
          status: 200,
          bodyText: 'not-json',
        }),
      ),
    );

    await expect(
      executeRequest({
        config: baseConfig,
        method: 'GET',
        options: { path: '/bad-json' },
      }),
    ).rejects.toThrow(InternalError);
  });

  it('should throw InternalError when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(
      executeRequest({
        config: baseConfig,
        method: 'GET',
        options: { path: '/fail' },
      }),
    ).rejects.toThrow(InternalError);
  });
});
