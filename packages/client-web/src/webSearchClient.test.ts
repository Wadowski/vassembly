import { describe, expect, it } from 'vitest';

import { createWebSearchClient } from './webSearchClient';
import { createDuckDuckGoSearchResponse } from './testFixtures/searchHtml';

describe('createWebSearchClient', () => {
  it('should parse DuckDuckGo HTML results into title, url, and snippet', async () => {
    const client = createWebSearchClient({
      fetchFn: async () => createDuckDuckGoSearchResponse(),
      maxResults: 2,
    });

    const response = await client.search({ query: 'example query' });

    expect(response.results).toEqual([
      {
        title: 'First Result',
        url: 'https://example.com/first',
        snippet: 'First snippet text',
      },
      {
        title: 'Second Result',
        url: 'https://example.com/second',
        snippet: 'Second snippet text',
      },
    ]);
  });

  it('should return empty results for blank query', async () => {
    const client = createWebSearchClient({
      fetchFn: async () => {
        throw new Error('fetch should not be called');
      },
    });

    const response = await client.search({ query: '   ' });

    expect(response.results).toEqual([]);
  });

  it('should throw when search response is not ok', async () => {
    const client = createWebSearchClient({
      fetchFn: async () => new Response('error', { status: 503 }),
    });

    await expect(client.search({ query: 'test' })).rejects.toThrow(
      'Search request failed with status 503',
    );
  });
});
