import { ApolloClient, gql } from '@apollo/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApolloInstance } from './createApolloInstance';

describe('createApolloInstance', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return an ApolloClient that can run a query when auth satisfies the server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const auth = new Headers(init?.headers).get('Authorization');
        if (auth !== 'Bearer my-token') {
          return new Response(JSON.stringify({ errors: [{ message: 'Unauthorized' }] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ data: { __typename: 'Query' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    const client = createApolloInstance({
      endpoint: 'https://api.example.com/graphql',
      getAuthToken: async () => 'my-token',
    });

    expect(client).toBeInstanceOf(ApolloClient);

    const result = await client.query({
      query: gql`
        query T {
          __typename
        }
      `,
    });

    expect(result.data).toEqual({ __typename: 'Query' });
  });

  it('should reject when getAuthToken fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const client = createApolloInstance({
      endpoint: 'https://api.example.com/graphql',
      getAuthToken: async () => {
        throw new Error('token store broken');
      },
    });

    await expect(
      client.query({
        query: gql`
          query T {
            __typename
          }
        `,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('Failed to resolve auth token'),
    });
  });
});
