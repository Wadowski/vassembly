import { describe, expect, it, vi } from 'vitest';

vi.mock('@vassembly/client-web', () => ({
  createPageContentClient: vi.fn(),
}));

import { createPageContentClient } from '@vassembly/client-web';

import { webPageContent } from './index';

describe('webPageContent', () => {
  it('should return JSON page content result', async () => {
    const fetch = vi.fn().mockResolvedValue({
      url: 'https://example.com/article',
      text: 'Article body',
      images: ['https://example.com/cover.jpg'],
      videos: [],
    });
    vi.mocked(createPageContentClient).mockReturnValue({ fetch });

    const result = await webPageContent({
      args: { url: 'https://example.com/article' },
    });

    expect(JSON.parse(result)).toEqual({
      url: 'https://example.com/article',
      text: 'Article body',
      images: ['https://example.com/cover.jpg'],
      videos: [],
    });
  });

  it('should return error string when url is missing', async () => {
    const result = await webPageContent({ args: {} });

    expect(result).toBe('Unable to fetch page content: url is required');
  });

  it('should return error string when fetch fails', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('Request failed with status 404'));
    vi.mocked(createPageContentClient).mockReturnValue({ fetch });

    const result = await webPageContent({
      args: { url: 'https://example.com/missing' },
    });

    expect(result).toBe('Unable to fetch page content: Request failed with status 404');
  });
});
