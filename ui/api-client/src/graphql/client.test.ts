import { CommonError, UnauthorizedError, WrongParamError } from '@vassembly/errors';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockFetchResponse } from '../test/mockFetchResponse';
import { createGraphQLClient } from './client';

describe('createGraphQLClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return data when the GraphQL response contains data and no errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: true,
          status: 200,
          bodyText: JSON.stringify({ data: { viewer: { id: 'u1' } } }),
        }),
      ),
    );

    const client = createGraphQLClient({ endpoint: 'https://api.example.com/graphql' });
    const data = await client.query<{ viewer: { id: string } }>({
      query: '{ viewer { id } }',
    });

    expect(data.viewer.id).toBe('u1');
  });

  it('should throw CommonError when the GraphQL payload includes errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: true,
          status: 200,
          bodyText: JSON.stringify({
            errors: [{ message: 'Field not found' }],
            data: null,
          }),
        }),
      ),
    );

    const client = createGraphQLClient({ endpoint: 'https://api.example.com/graphql' });

    await expect(
      client.query({
        query: '{ broken }',
      }),
    ).rejects.toThrow(CommonError);
  });

  it('should throw WrongParamError when the query document is invalid', async () => {
    const client = createGraphQLClient({ endpoint: 'https://api.example.com/graphql' });

    await expect(
      client.query({
        query: '{ not valid',
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should map HTTP 401 to UnauthorizedError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse({
          ok: false,
          status: 401,
          bodyText: JSON.stringify({ message: 'Unauthorized' }),
        }),
      ),
    );

    const client = createGraphQLClient({ endpoint: 'https://api.example.com/graphql' });

    await expect(
      client.mutate({
        query: 'mutation { noop }',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });
});
