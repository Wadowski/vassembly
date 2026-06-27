import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetRaw } = vi.hoisted(() => ({
  mockGetRaw: vi.fn(),
}));

vi.mock('../../clients', () => ({
  skillMongodbDao: {
    getRaw: mockGetRaw,
  },
}));

import { getActiveRuleByName } from './index';

const SPECIALIZATION_ID = '507f1f77bcf86cd799439012';

describe('getActiveRuleByName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return rule for active skill', async () => {
    mockGetRaw.mockResolvedValue({
      name: 'contract-review',
      rule: 'Follow the checklist.',
      enabled: true,
    });

    const result = await getActiveRuleByName({
      specializationId: SPECIALIZATION_ID,
      skillName: 'contract-review',
    });

    expect(result.rule).toBe('Follow the checklist.');
    expect(mockGetRaw).toHaveBeenCalledWith({
      specializationId: SPECIALIZATION_ID,
      name: 'contract-review',
      enabled: true,
      $or: [{ removedAt: { $exists: false } }, { removedAt: null }],
    });
  });

  it('should throw NotFoundError when skill is missing or inactive', async () => {
    mockGetRaw.mockResolvedValue(null);

    await expect(
      getActiveRuleByName({
        specializationId: SPECIALIZATION_ID,
        skillName: 'contract-review',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
