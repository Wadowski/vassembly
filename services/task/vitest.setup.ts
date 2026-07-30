import { vi } from 'vitest';

vi.mock('@vassembly/client-mongodb', () => {
  const mockCollection = {
    createIndex: vi.fn(),
    countDocuments: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  };

  return {
    mongoDb: {
      db: {
        collection: vi.fn(() => mockCollection),
      },
      connect: vi.fn(),
    },
    MongoDbDAO: vi.fn(() => ({
      get: vi.fn(),
      getManyRaw: vi.fn(),
      getRaw: vi.fn(),
      collection: mockCollection,
    })),
    init: vi.fn(),
  };
});

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
    connect: vi.fn(),
  },
}));
