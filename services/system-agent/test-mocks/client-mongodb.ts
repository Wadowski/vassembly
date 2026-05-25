import { vi } from 'vitest';

const mockCollection = {
  createIndex: vi.fn(),
  countDocuments: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
};

export const mongoDb = {
  db: {
    collection: vi.fn(() => mockCollection),
  },
  connect: vi.fn(),
};

export const MongoDbDAO = vi.fn(() => ({
  get: vi.fn(),
  getManyRaw: vi.fn(),
  findOneRaw: vi.fn(),
  collection: mockCollection,
}));

export const init = vi.fn();
