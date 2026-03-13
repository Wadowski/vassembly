import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInsertOne = vi.fn();
const mockInsertMany = vi.fn();
const mockFindOne = vi.fn();
const mockAggregate = vi.fn();
const mockUpdateOne = vi.fn();
const mockUpdateMany = vi.fn();
const mockDeleteOne = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock('./connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(() => ({
        insertOne: mockInsertOne,
        insertMany: mockInsertMany,
        findOne: mockFindOne,
        aggregate: mockAggregate,
        updateOne: mockUpdateOne,
        updateMany: mockUpdateMany,
        deleteOne: mockDeleteOne,
        deleteMany: mockDeleteMany,
      })),
    },
  },
}));

const createMockModel = (overrides: Record<string, unknown> = {}) => ({
  toMongoDb: vi.fn((opts?: { isCreate?: boolean; isUpdate?: boolean; isRemove?: boolean }) => {
    if (opts?.isRemove) {
      return { deleted: true, ...overrides };
    }
    if (opts?.isCreate) {
      return { name: 'test', ...overrides };
    }
    return { id: '123', ...overrides };
  }),
  toJSON: vi.fn(() => ({ id: '123', ...overrides })),
});

describe('MongoDbDAO', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
  });

  const getDao = async () => {
    const { MongoDbDAO } = await import('./dao.js');
    return MongoDbDAO({ collectionName: 'test_collection' });
  };

  describe('create', () => {
    it('inserts document and returns inserted id', async () => {
      const mockId = { toString: () => 'new-id-123' };
      mockInsertOne.mockResolvedValue({ insertedId: mockId });

      const dao = await getDao();
      const data = createMockModel();
      const result = await dao.create(data as any);

      expect(mockInsertOne).toHaveBeenCalledWith(
        { name: 'test' },
        null
      );
      expect(result).toBe('new-id-123');
    });

    it('passes transaction options when context provided', async () => {
      const mockSession = {};
      mockInsertOne.mockResolvedValue({ insertedId: { toString: () => 'id' } });

      const dao = await getDao();
      const data = createMockModel();
      await dao.create(data as any, {
        context: { session: mockSession } as any,
      });

      expect(mockInsertOne).toHaveBeenCalledWith(
        { name: 'test' },
        { session: mockSession, returnOriginal: false }
      );
    });
  });

  describe('createMany', () => {
    it('inserts multiple documents and returns ids', async () => {
      mockInsertMany.mockResolvedValue({
        insertedIds: {
          0: { toString: () => 'id-1' },
          1: { toString: () => 'id-2' },
        },
      });

      const dao = await getDao();
      const data = [createMockModel(), createMockModel()];
      const result = await dao.createMany(data as any);

      expect(mockInsertMany).toHaveBeenCalledWith(
        [{ name: 'test' }, { name: 'test' }],
        null
      );
      expect(result).toEqual(['id-1', 'id-2']);
    });
  });

  describe('get', () => {
    it('returns null when document not found', async () => {
      mockFindOne.mockResolvedValue(null);

      const dao = await getDao();
      const where = createMockModel();
      const result = await dao.get(where as any);

      expect(result).toBeNull();
    });

    it('returns document with id when found', async () => {
      const docId = { toString: () => 'doc-id' };
      mockFindOne.mockResolvedValue({
        _id: docId,
        name: 'found',
      });

      const dao = await getDao();
      const where = createMockModel();
      const result = await dao.get(where as any);

      expect(result).toMatchObject({
        name: 'found',
        id: 'doc-id',
      });
      expect((result as { id: string })?.id).toBe('doc-id');
    });

    it('passes projection when provided', async () => {
      mockFindOne.mockResolvedValue(null);

      const dao = await getDao();
      const where = createMockModel();
      await dao.get(where as any, { projection: { name: 1 } });

      expect(mockFindOne).toHaveBeenCalledWith(
        { id: '123' },
        { projection: { name: 1 } }
      );
    });
  });

  describe('getMany', () => {
    it('returns mapped documents with id field', async () => {
      const mockToArray = vi.fn().mockResolvedValue([
        { _id: { toString: () => 'a' }, name: 'doc1' },
        { _id: { toString: () => 'b' }, name: 'doc2' },
      ]);
      mockAggregate.mockReturnValue({ toArray: mockToArray });

      const dao = await getDao();
      const where = createMockModel();
      const result = await dao.getMany(where as any);

      expect(mockAggregate).toHaveBeenCalledWith([
        { $match: { id: '123' } },
      ]);
      expect(result).toEqual([
        { _id: expect.anything(), name: 'doc1', id: 'a' },
        { _id: expect.anything(), name: 'doc2', id: 'b' },
      ]);
    });

    it('applies limit and offset', async () => {
      mockAggregate.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });

      const dao = await getDao();
      const where = createMockModel();
      await dao.getMany(where as any, { limit: 10, offset: 5 });

      expect(mockAggregate).toHaveBeenCalledWith([
        { $match: { id: '123' } },
        { $limit: 10 },
        { $skip: 5 },
      ]);
    });
  });

  describe('getManyRaw', () => {
    it('uses raw where without toMongoDb', async () => {
      mockAggregate.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });

      const dao = await getDao();
      await dao.getManyRaw({ customField: 'value' });

      expect(mockAggregate).toHaveBeenCalledWith([{ $match: { customField: 'value' } }]);
    });

    it('applies sort, offset, and limit', async () => {
      mockAggregate.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) });

      const dao = await getDao();
      await dao.getManyRaw(
        { x: 1 },
        { sort: { name: -1 }, offset: 2, limit: 5 }
      );

      expect(mockAggregate).toHaveBeenCalledWith([
        { $match: { x: 1 } },
        { $sort: { name: -1 } },
        { $skip: 2 },
        { $limit: 5 },
      ]);
    });
  });

  describe('update', () => {
    it('calls updateOne with $set', async () => {
      mockUpdateOne.mockResolvedValue({});

      const dao = await getDao();
      const where = createMockModel();
      const data = createMockModel({ name: 'updated' });
      await dao.update(where as any, data as any);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { id: '123' },
        { $set: expect.objectContaining({ name: 'updated' }) },
        null
      );
    });
  });

  describe('updateMany', () => {
    it('calls updateMany with $set', async () => {
      mockUpdateMany.mockResolvedValue({});

      const dao = await getDao();
      const where = createMockModel();
      const data = createMockModel({ status: 'active' });
      await dao.updateMany(where as any, data as any);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { id: '123' },
        expect.objectContaining({ $set: expect.any(Object) }),
        null
      );
    });
  });

  describe('upsert', () => {
    it('returns upserted id when document inserted', async () => {
      mockUpdateOne.mockResolvedValue({
        upsertedId: { toString: () => 'upserted-id' },
      });

      const dao = await getDao();
      const where = createMockModel();
      const data = createMockModel();
      const result = await dao.upsert(where as any, data as any);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { id: '123' },
        expect.any(Object),
        expect.objectContaining({ upsert: true })
      );
      expect(result).toBe('upserted-id');
    });

    it('returns existing id when document updated', async () => {
      mockUpdateOne.mockResolvedValue({ upsertedId: null });
      mockFindOne.mockResolvedValue({ _id: { toString: () => 'existing-id' } });

      const dao = await getDao();
      const where = createMockModel();
      const data = createMockModel();
      const result = await dao.upsert(where as any, data as any);

      expect(result).toBe('existing-id');
    });
  });

  describe('remove', () => {
    it('calls updateOne with soft delete', async () => {
      mockUpdateOne.mockResolvedValue({});

      const dao = await getDao();
      const where = createMockModel();
      await dao.remove(where as any);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { id: '123' },
        expect.objectContaining({ $set: expect.objectContaining({ deleted: true }) }),
        null
      );
    });
  });

  describe('removeMany', () => {
    it('calls updateMany with soft delete', async () => {
      mockUpdateMany.mockResolvedValue({});

      const dao = await getDao();
      const where = createMockModel();
      await dao.removeMany(where as any);

      expect(mockUpdateMany).toHaveBeenCalledWith(
        { id: '123' },
        expect.objectContaining({ $set: expect.objectContaining({ deleted: true }) }),
        null
      );
    });
  });

  describe('removeHard', () => {
    it('calls deleteOne', async () => {
      mockDeleteOne.mockResolvedValue({});

      const dao = await getDao();
      const where = createMockModel();
      await dao.removeHard(where as any);

      expect(mockDeleteOne).toHaveBeenCalledWith({ id: '123' }, null);
    });
  });

  describe('removeHardMany', () => {
    it('calls deleteMany', async () => {
      mockDeleteMany.mockResolvedValue({});

      const dao = await getDao();
      const where = createMockModel();
      await dao.removeHardMany(where as any);

      expect(mockDeleteMany).toHaveBeenCalledWith({ id: '123' }, null);
    });
  });

  describe('transformToDeepUpdate', () => {
    it('flattens nested objects and filters undefined', async () => {
      const dao = await getDao();
      const result = dao.transformToDeepUpdate({
        a: 1,
        b: { c: 2 },
        d: undefined,
      });

      expect(result).toEqual({ a: 1, 'b.c': 2 });
    });
  });
});
