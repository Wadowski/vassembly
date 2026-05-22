import { vi } from 'vitest';

vi.mock('@vassembly/client-mongodb', () => ({
  MongoDbDAO: vi.fn(() => ({})),
  mongoDb: {
    connect: vi.fn(),
    db: {
      collection: vi.fn(),
    },
  },
  init: vi.fn(),
}));
