import { describe, expect, it } from 'vitest';

import { formatMcpCatalogSection } from './formatMcpCatalogSection';

describe('formatMcpCatalogSection', () => {
  it('should format MCP entries as name, slug, and description lines', () => {
    const result = formatMcpCatalogSection({
      mcps: [
        {
          name: 'Notion',
          slug: 'notion',
          description: 'Create and update Notion pages',
        },
        {
          name: 'Slack',
          slug: 'slack',
          description: 'Post messages to Slack channels',
        },
      ],
    });

    expect(result).toBe(
      [
        '- Notion (notion): Create and update Notion pages',
        '- Slack (slack): Post messages to Slack channels',
      ].join('\n'),
    );
  });

  it('should return empty string when MCP catalog is empty', () => {
    const result = formatMcpCatalogSection({ mcps: [] });

    expect(result).toBe('');
  });
});
