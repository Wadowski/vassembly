import { describe, expect, it } from 'vitest';

import { extractPageContent } from './htmlExtraction';

describe('extractPageContent', () => {
  it('should strip noise elements and return text with media URLs', () => {
    const html = `
      <html>
        <head><script>alert(1)</script><style>.x{}</style></head>
        <body>
          <nav>Skip me</nav>
          <main>
            <h1>Hello world</h1>
            <p>Paragraph text</p>
            <img src="/images/photo.png" />
            <video src="clip.mp4"><source src="/media/trailer.webm" /></video>
          </main>
          <footer>Footer</footer>
        </body>
      </html>
    `;

    const result = extractPageContent({
      html,
      baseUrl: 'https://example.com/page',
    });

    expect(result.text).toContain('Hello world');
    expect(result.text).toContain('Paragraph text');
    expect(result.text).not.toContain('Skip me');
    expect(result.text).not.toContain('Footer');
    expect(result.images).toEqual(['https://example.com/images/photo.png']);
    expect(result.videos).toEqual([
      'https://example.com/clip.mp4',
      'https://example.com/media/trailer.webm',
    ]);
    expect(result.url).toBe('https://example.com/page');
  });
});
