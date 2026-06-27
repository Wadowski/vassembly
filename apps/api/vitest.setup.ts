import { vi } from 'vitest';

if (typeof process.getBuiltinModule !== 'function') {
  process.getBuiltinModule = () => undefined;
}

vi.mock('bson', () => {
  class ObjectId {
    private readonly value: string;

    constructor(value?: string) {
      this.value = value ?? '507f1f77bcf86cd799439011';
    }

    toString(): string {
      return this.value;
    }

    toHexString(): string {
      return this.value;
    }
  }

  return { ObjectId };
});

vi.mock('mongodb', () => {
  class ObjectId {
    private readonly value: string;

    constructor(value?: string) {
      this.value = value ?? '507f1f77bcf86cd799439011';
    }

    toString(): string {
      return this.value;
    }

    toHexString(): string {
      return this.value;
    }
  }

  return { ObjectId };
});

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

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));
