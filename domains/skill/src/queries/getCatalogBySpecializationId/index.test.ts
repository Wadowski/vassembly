import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetManyRaw } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
}));

vi.mock('../../clients', () => ({
  skillMongodbDao: {
    getManyRaw: mockGetManyRaw,
  },
}));

import { getCatalogBySpecializationId } from './index';

const SPECIALIZATION_ID = '507f1f77bcf86cd799439012';

describe('getCatalogBySpecializationId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return only enabled non-archived skills with name and description', async () => {
    mockGetManyRaw.mockResolvedValue([
      {
        name: 'contract-review',
        description: 'Review contracts',
        input: 'contract text',
        output: 'findings list',
        rule: 'hidden',
        enabled: true,
      },
      {
        name: 'legal-research',
        description: 'Research law',
        rule: 'hidden',
        enabled: true,
      },
    ]);

    const result = await getCatalogBySpecializationId({ specializationId: SPECIALIZATION_ID });

    expect(result.items).toEqual([
      {
        name: 'contract-review',
        description: 'Review contracts',
        input: 'contract text',
        output: 'findings list',
      },
      {
        name: 'legal-research',
        description: 'Research law',
        input: '',
        output: '',
      },
    ]);
    expect(mockGetManyRaw).toHaveBeenCalledWith(
      {
        specializationId: SPECIALIZATION_ID,
        enabled: true,
        $or: [{ removedAt: { $exists: false } }, { removedAt: null }],
      },
      { sort: { name: 1 } },
    );
  });

  it('should return empty items when no active skills exist', async () => {
    mockGetManyRaw.mockResolvedValue([]);

    const result = await getCatalogBySpecializationId({ specializationId: SPECIALIZATION_ID });

    expect(result.items).toEqual([]);
  });
});
