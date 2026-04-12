import {
  CommonError,
  NotFoundError,
  UnauthorizedError,
} from '@vassembly/errors';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchResponse } from '../test/mockFetchResponse';
import { createHttpClient } from './client';

describe('createHttpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return parsed JSON when response is successful', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: true,
          status: 200,
          bodyText: JSON.stringify({ id: 'a', name: 'Test' }),
        }),
      ),
    );

    const client = createHttpClient({ baseUrl: 'https://api.example.com' });
    const result = await client.get<{ id: string; name: string }>({ path: '/items/1' });

    expect(result.id).toBe('a');
    expect(result.name).toBe('Test');
  });

  it('should throw UnauthorizedError when response status is 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: false,
          status: 401,
          bodyText: JSON.stringify({ message: 'Invalid token' }),
        }),
      ),
    );

    const client = createHttpClient({ baseUrl: 'https://api.example.com' });

    await expect(client.get({ path: '/secure' })).rejects.toThrow(UnauthorizedError);
  });

  it('should throw NotFoundError when response status is 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: false,
          status: 404,
          bodyText: '{}',
        }),
      ),
    );

    const client = createHttpClient({ baseUrl: 'https://api.example.com' });

    await expect(client.get({ path: '/missing' })).rejects.toThrow(NotFoundError);
  });

  it('should throw CommonError when response is an unmapped 4xx status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: false,
          status: 409,
          bodyText: JSON.stringify({ message: 'Conflict' }),
        }),
      ),
    );

    const client = createHttpClient({ baseUrl: 'https://api.example.com' });

    await expect(client.get({ path: '/items' })).rejects.toThrow(CommonError);
  });
});
