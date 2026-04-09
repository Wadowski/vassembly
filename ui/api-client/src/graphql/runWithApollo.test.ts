import { ApolloError, type ApolloClient } from '@apollo/client';
import { CommonError, InternalError } from '@vassembly/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runWithApollo } from './runWithApollo';

const minimalConfig = { endpoint: 'https://api.example.com/graphql' };

describe('runWithApollo', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return data when execute resolves with non-null data', async () => {
    const result = await runWithApollo<{ id: string }>({
      apollo: {} as ApolloClient,
      config: minimalConfig,
      options: { query: 'query { x }' },
      execute: async () => ({ data: { id: '1' } }),
    });

    expect(result).toEqual({ id: '1' });
  });

  it('should reject with InternalError when data is null or undefined', async () => {
    await expect(
      runWithApollo({
        apollo: {} as ApolloClient,
        config: minimalConfig,
        options: { query: 'query { x }' },
        execute: async () => ({ data: null }),
      }),
    ).rejects.toThrow(InternalError);

    await expect(
      runWithApollo({
        apollo: {} as ApolloClient,
        config: minimalConfig,
        options: { query: 'query { x }' },
        execute: async () => ({ data: undefined }),
      }),
    ).rejects.toThrow(InternalError);
  });

  it('should map errors from execute through mapApolloError', async () => {
    await expect(
      runWithApollo({
        apollo: {} as ApolloClient,
        config: minimalConfig,
        options: { query: 'query { x }' },
        execute: async () => {
          throw new ApolloError({
            graphQLErrors: [{ message: 'GQL' }],
          });
        },
      }),
    ).rejects.toThrow(CommonError);
  });
});
