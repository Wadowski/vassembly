import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockFindOne } = vi.hoisted(() => ({
  mockFindOne: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskPlanTemplateMongodbDao: {
    findOne: mockFindOne,
  },
}));

import { findEquivalent } from './index';

const MATCHING_HASH = 'abc123hash';
const TEMPLATE_ID = '507f1f77bcf86cd799439011';

describe('findEquivalent task plan template query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return template when shortName matches exactly', async () => {
    mockFindOne.mockResolvedValueOnce({
      id: TEMPLATE_ID,
      shortName: 'contract-risk-review',
      removedAt: null,
    });

    const result = await findEquivalent({
      shortName: 'contract-risk-review',
      normalizedDescriptionHash: 'different-hash',
    });

    expect(result.data?.id).toBe(TEMPLATE_ID);
  });

  it('should return template when normalizedDescriptionHash matches exactly', async () => {
    mockFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: TEMPLATE_ID,
        shortName: 'other-name',
        normalizedDescriptionHash: MATCHING_HASH,
        removedAt: null,
      });

    const result = await findEquivalent({
      shortName: 'unique-short-name',
      normalizedDescriptionHash: MATCHING_HASH,
    });

    expect(result.data?.id).toBe(TEMPLATE_ID);
  });

  it('should return null when no non-removed template matches', async () => {
    mockFindOne.mockResolvedValue(null);

    const result = await findEquivalent({
      shortName: 'no-match',
      normalizedDescriptionHash: 'no-match-hash',
    });

    expect(result.data).toBeNull();
  });
});
