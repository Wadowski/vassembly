import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  skillMongodbDao: {
    getManyRaw: mockGetManyRaw,
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

vi.mock('../../model', () => ({
  skillFactory: {
    create: vi.fn((row: Record<string, unknown>) => row),
  },
}));

import { getBySpecializationId } from './index';

const SPECIALIZATION_ID = '507f1f77bcf86cd799439012';

describe('getBySpecializationId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetManyRaw.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);
  });

  it('should exclude archived skills in the query filter', async () => {
    await getBySpecializationId({ specializationId: SPECIALIZATION_ID });

    expect(mockGetManyRaw).toHaveBeenCalledWith(
      expect.objectContaining({
        $and: expect.arrayContaining([
          { specializationId: SPECIALIZATION_ID },
          { $or: [{ removedAt: { $exists: false } }, { removedAt: null }] },
        ]),
      }),
      expect.any(Object),
    );
  });
});
