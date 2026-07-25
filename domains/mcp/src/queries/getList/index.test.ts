import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getList } from './index';
import {
  SEED_MCP_DOCS,
  SEED_MCPS,
  buildPaginationDataset,
  createInMemoryMcpStore,
} from './testFixtures';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetManyRaw, mockCountDocuments } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
  mockCountDocuments: vi.fn(),
}));

vi.mock('../../clients', () => ({
  mcpMongodbDao: {
    getManyRaw: mockGetManyRaw,
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

const wireInMemoryStore = (docs = SEED_MCP_DOCS) => {
  const store = createInMemoryMcpStore(docs);
  mockGetManyRaw.mockImplementation(store.getManyRaw);
  mockCountDocuments.mockImplementation(store.countDocuments);
};

describe('getList mcp query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wireInMemoryStore();
  });

  describe('pagination', () => {
    it('should return first page of MCPs when page is 0 and size is 20', async () => {
      wireInMemoryStore(buildPaginationDataset(25));

      const result = await getList({ page: 0, size: 20 });

      expect(result.items).toHaveLength(20);
      expect(result.page).toBe(0);
      expect(result.size).toBe(20);
    });

    it('should return next page of MCPs when page is 1 and size is 20', async () => {
      wireInMemoryStore(buildPaginationDataset(25));

      const result = await getList({ page: 1, size: 20 });

      expect(result.items).toHaveLength(5);
      expect(result.page).toBe(1);
      expect(result.size).toBe(20);
    });

    it('should return remaining MCPs on the last page', async () => {
      wireInMemoryStore(buildPaginationDataset(25));

      const result = await getList({ page: 1, size: 20 });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(20);
      expect(result.total).toBe(25);
    });

    it('should return empty items when page is beyond available results', async () => {
      wireInMemoryStore(buildPaginationDataset(25));

      const result = await getList({ page: 5, size: 20 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(25);
    });
  });

  describe('search', () => {
    it('should match MCPs by name when search term matches name', async () => {
      const result = await getList({ search: 'wikipedia' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Wikipedia MCP');
    });

    it('should match MCPs by description when search term matches description', async () => {
      const result = await getList({ search: 'articles' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Wikipedia MCP');
    });

    it('should match MCPs case-insensitively when search term uses different casing', async () => {
      const result = await getList({ search: 'WIKIPEDIA' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('Wikipedia MCP');
    });

    it('should return no MCPs when search term matches nothing', async () => {
      const result = await getList({ search: 'nonexistent' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all MCPs when search is empty', async () => {
      const result = await getList({ search: '' });

      expect(result.items).toHaveLength(SEED_MCPS.length);
      expect(result.total).toBe(SEED_MCPS.length);
    });
  });

  describe('tag filter', () => {
    it('should return only MCPs with selected tag when one tag is provided', async () => {
      const result = await getList({ tags: ['knowledge'] });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.tags).toContain('knowledge');
    });

    it('should return MCPs matching any selected tag when multiple tags are provided', async () => {
      const result = await getList({ tags: ['search', 'knowledge'] });

      expect(result.items).toHaveLength(2);
      expect(result.items.map((item) => item.slug).sort()).toEqual(
        ['brave-search-mcp', 'wikipedia-mcp'].sort(),
      );
    });

    it('should return no MCPs when tag filter matches nothing', async () => {
      const result = await getList({ tags: ['nonexistent'] });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all MCPs when tags filter is empty', async () => {
      const result = await getList({ tags: [] });

      expect(result.items).toHaveLength(SEED_MCPS.length);
      expect(result.total).toBe(SEED_MCPS.length);
    });
  });

  describe('combined filters', () => {
    it('should apply search, tag filter, and pagination together', async () => {
      wireInMemoryStore(buildPaginationDataset(25));

      const result = await getList({
        search: 'MCP',
        tags: ['catalog'],
        page: 0,
        size: 10,
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.length).toBeLessThanOrEqual(10);
      expect(result.items.every((item) => item.name.toLowerCase().includes('mcp'))).toBe(true);
      expect(result.items.every((item) => item.tags.includes('catalog'))).toBe(true);
      expect(result.page).toBe(0);
      expect(result.size).toBe(10);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe('sorting', () => {
    it('should return MCPs sorted by name ascending', async () => {
      const result = await getList({});

      const names = result.items.map((item) => item.name);
      expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right)));
      expect(names[0]).toBe('Brave Search MCP');
      expect(names[names.length - 1]).toBe('Wikipedia MCP');
    });
  });

  describe('response shape', () => {
    it('should return items, total, page, and size in the response', async () => {
      const result = await getList({ page: 0, size: 20 });

      expect(result).toEqual(
        expect.objectContaining({
          items: expect.any(Array),
          total: expect.any(Number),
          page: 0,
          size: 20,
        }),
      );
    });

    it('should return correct total count for filtered results', async () => {
      const result = await getList({ search: 'brave', tags: ['search'] });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.slug).toBe('brave-search-mcp');
    });
  });
});
