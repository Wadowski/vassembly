import type { McpListItemResponse } from '@vassembly/domain-mcp';

const buildCatalogEntry = (
  overrides: Partial<McpListItemResponse> & Pick<McpListItemResponse, 'id' | 'slug' | 'name'>,
): McpListItemResponse => ({
  description: 'Test MCP',
  tags: ['test'],
  iconPath: '/mcps/test.svg',
  documentationUrl: null,
  repositoryUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  configurationStatus: 'pending',
  ...overrides,
});

export const mockWikipediaCatalogEntry = buildCatalogEntry({
  id: 'mcp-wikipedia',
  slug: 'wikipedia-mcp',
  name: 'Wikipedia',
  configSchema: {
    fields: [],
  },
});

export const mockBraveCatalogEntry = buildCatalogEntry({
  id: 'mcp-brave',
  slug: 'brave-search-mcp',
  name: 'Brave',
  configSchema: {
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }],
  },
});

export const buildSimpleFieldCatalogEntry = (id: string): McpListItemResponse =>
  buildCatalogEntry({
    id,
    slug: id,
    name: `MCP ${id}`,
    configSchema: {
      fields: [{ key: 'field', label: 'Field', type: 'text', required: true }],
    },
  });

export const TEST_MCP_CATALOG: Record<string, McpListItemResponse> = {
  'mcp-wikipedia': mockWikipediaCatalogEntry,
  'mcp-brave': mockBraveCatalogEntry,
  'mcp-nonexistent': buildCatalogEntry({
    id: 'mcp-nonexistent',
    slug: 'nonexistent',
    name: 'Nonexistent',
    configSchema: { fields: [] },
  }),
};

for (let index = 0; index < 10; index += 1) {
  TEST_MCP_CATALOG[`mcp-${index}`] = buildSimpleFieldCatalogEntry(`mcp-${index}`);
}
