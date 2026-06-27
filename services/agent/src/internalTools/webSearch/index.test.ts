import { describe, expect, it, vi } from 'vitest';

vi.mock('@vassembly/client-web', () => ({
  createWebSearchClient: vi.fn(),
}));

import { createWebSearchClient } from '@vassembly/client-web';

import { webSearch } from './index';

describe('webSearch', () => {
  it('should return JSON array of search results', async () => {
    const search = vi.fn().mockResolvedValue({
      results: [
        {
          title: 'Example',
          url: 'https://example.com',
          snippet: 'Example snippet',
        },
      ],
    });
    vi.mocked(createWebSearchClient).mockReturnValue({ search });

    const result = await webSearch({ args: { query: 'example query' } });

    expect(JSON.parse(result)).toEqual([
      {
        title: 'Example',
        url: 'https://example.com',
        snippet: 'Example snippet',
      },
    ]);
  });

  it('should return error string when query is missing', async () => {
    const result = await webSearch({ args: {} });

    expect(result).toBe('Unable to search the web: query is required');
  });

  it('should return error string when search fails', async () => {
    const search = vi.fn().mockRejectedValue(new Error('network down'));
    vi.mocked(createWebSearchClient).mockReturnValue({ search });

    const result = await webSearch({ args: { query: 'example' } });

    expect(result).toBe('Unable to search the web: network down');
  });
});
