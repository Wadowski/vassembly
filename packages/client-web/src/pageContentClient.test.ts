import { describe, expect, it } from 'vitest';

import { createPageContentClient } from './pageContentClient';

const SAMPLE_HTML = `
  <html>
    <body>
      <h1>Article</h1>
      <img src="/cover.jpg" />
    </body>
  </html>
`;

describe('createPageContentClient', () => {
  it('should fetch HTTPS page and return extracted content', async () => {
    const client = createPageContentClient({
      fetchFn: async () =>
        new Response(SAMPLE_HTML, {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }),
    });

    const result = await client.fetch({ url: 'https://example.com/article' });

    expect(result.text).toContain('Article');
    expect(result.images).toEqual(['https://example.com/cover.jpg']);
    expect(result.url).toBe('https://example.com/article');
  });

  it('should reject non-HTTPS URLs', async () => {
    const client = createPageContentClient({
      fetchFn: async () => new Response(SAMPLE_HTML, { status: 200 }),
    });

    await expect(client.fetch({ url: 'http://example.com/article' })).rejects.toThrow(
      'Only HTTPS URLs are allowed',
    );
  });

  it('should reject private network URLs', async () => {
    const client = createPageContentClient({
      fetchFn: async () => new Response(SAMPLE_HTML, { status: 200 }),
    });

    await expect(client.fetch({ url: 'https://127.0.0.1/internal' })).rejects.toThrow(
      'URL hostname is not allowed',
    );
  });

  it('should throw when fetch response is not ok', async () => {
    const client = createPageContentClient({
      fetchFn: async () => new Response('missing', { status: 404 }),
    });

    await expect(client.fetch({ url: 'https://example.com/missing' })).rejects.toThrow(
      'Request failed with status 404',
    );
  });
});
