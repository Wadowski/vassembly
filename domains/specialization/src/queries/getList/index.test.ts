import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getList } from './index';
import {
  SEED_SPECIALIZATION_DOCS,
  SEED_SPECIALIZATIONS,
  buildPaginationDataset,
  createInMemorySpecializationStore,
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
  specializationMongodbDao: {
    getManyRaw: mockGetManyRaw,
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

const wireInMemoryStore = (
  docs = SEED_SPECIALIZATION_DOCS,
): ReturnType<typeof createInMemorySpecializationStore> => {
  const store = createInMemorySpecializationStore(docs);
  mockGetManyRaw.mockImplementation(store.getManyRaw);
  mockCountDocuments.mockImplementation(store.countDocuments);
  return store;
};

describe('getList specialization query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wireInMemoryStore();
  });

  describe('pagination', () => {
    it('should return first page when page is 0 and size is 20', async () => {
      wireInMemoryStore(buildPaginationDataset(25));

      const result = await getList({ page: 0, size: 20 });

      expect(result.items).toHaveLength(20);
      expect(result.page).toBe(0);
      expect(result.size).toBe(20);
      expect(result.total).toBe(25);
    });

    it('should return next page when page is 1 and size is 20', async () => {
      wireInMemoryStore(buildPaginationDataset(25));

      const result = await getList({ page: 1, size: 20 });

      expect(result.items).toHaveLength(5);
      expect(result.page).toBe(1);
      expect(result.size).toBe(20);
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
    it('should match specializations by name when search term matches name', async () => {
      const result = await getList({ search: 'email' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('email automation');
    });

    it('should match specializations case-insensitively when search term uses different casing', async () => {
      const result = await getList({ search: 'WEB' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe('web research');
    });

    it('should return no specializations when search term matches nothing', async () => {
      const result = await getList({ search: 'nonexistent' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should return all specializations when search is empty', async () => {
      const result = await getList({ search: '' });

      expect(result.items).toHaveLength(SEED_SPECIALIZATIONS.length);
      expect(result.total).toBe(SEED_SPECIALIZATIONS.length);
    });
  });

  describe('sorting', () => {
    it('should return specializations sorted by name ascending', async () => {
      const result = await getList({});

      const names = result.items.map((item) => item.name);
      expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right)));
      expect(names[0]).toBe('data analysis');
      expect(names[names.length - 1]).toBe('web research');
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

    it('should map specialization fields to SpecializationResponse DTO', async () => {
      const result = await getList({ search: 'email' });

      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'email automation',
          description: expect.any(String),
          createdAt: '2026-01-15T10:00:00.000Z',
          updatedAt: '2026-01-15T10:00:00.000Z',
        }),
      );
    });
  });
});
