import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetList } = vi.hoisted(() => ({
  mockGetList: vi.fn(),
}));

vi.mock('@vassembly/domain-mcp', () => ({
  default: {
    queries: {
      getList: mockGetList,
    },
  },
}));

import { buildMcpCatalogHintsSection } from './buildMcpCatalogHintsSection';

describe('buildMcpCatalogHintsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return Available tools/platforms section with formatted MCP catalog lines', async () => {
    mockGetList.mockResolvedValue({
      items: [
        {
          id: 'mcp-1',
          name: 'Notion',
          slug: 'notion',
          description: 'Create and update Notion pages',
        },
      ],
      total: 1,
      page: 0,
      size: 200,
    });

    const result = await buildMcpCatalogHintsSection();

    expect(result).toBe(
      [
        'Available tools/platforms:',
        '- Notion (notion): Create and update Notion pages',
      ].join('\n'),
    );
  });

  it('should return No cataloged MCPs when MCP catalog is empty', async () => {
    mockGetList.mockResolvedValue({
      items: [],
      total: 0,
      page: 0,
      size: 200,
    });

    const result = await buildMcpCatalogHintsSection();

    expect(result).toBe('No cataloged MCPs.');
  });
});
