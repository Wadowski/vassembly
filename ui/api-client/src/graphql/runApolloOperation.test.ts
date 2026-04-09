import type { ApolloClient } from '@apollo/client';
import { WrongParamError } from '@vassembly/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runApolloMutate, runApolloQuery } from './runApolloOperation';

const config = { endpoint: 'https://api.example.com/graphql' };

describe('runApolloQuery', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return query data when Apollo resolves successfully', async () => {
    const apollo = {
      query: async () => ({ data: { hello: 'world' } }),
    } as unknown as ApolloClient;

    const data = await runApolloQuery<{ hello: string }, Record<string, never>>({
      apollo,
      config,
      options: { query: 'query Q { hello }' },
    });

    expect(data).toEqual({ hello: 'world' });
  });

  it('should throw WrongParamError when the query document is invalid', async () => {
    const apollo = {
      query: async () => ({ data: {} }),
    } as unknown as ApolloClient;

    await expect(
      runApolloQuery({
        apollo,
        config,
        options: { query: 'this is not graphql' },
      }),
    ).rejects.toThrow(WrongParamError);
  });
});

describe('runApolloMutate', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return mutation data when Apollo resolves successfully', async () => {
    const apollo = {
      mutate: async () => ({ data: { ok: true } }),
    } as unknown as ApolloClient;

    const data = await runApolloMutate<{ ok: boolean }, Record<string, never>>({
      apollo,
      config,
      options: { query: 'mutation M { ok }' },
    });

    expect(data).toEqual({ ok: true });
  });
});
