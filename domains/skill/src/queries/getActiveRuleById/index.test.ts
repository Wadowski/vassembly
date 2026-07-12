import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

const { mockGetModelById } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
}));

vi.mock('../getModelById', () => ({
  getModelById: mockGetModelById,
}));

import { getActiveRuleById } from './index';

const SKILL_ID = '507f1f77bcf86cd799439011';

describe('getActiveRuleById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return rule and metadata for active skill', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: SKILL_ID,
        specializationId: 'spec-1',
        name: 'contract-review',
        rule: 'Follow the checklist.',
        enabled: true,
        scripts: [],
        usesSkillIds: ['child-1'],
      },
    });

    const result = await getActiveRuleById({ skillId: SKILL_ID });

    expect(result).toEqual({
      skillId: SKILL_ID,
      specializationId: 'spec-1',
      name: 'contract-review',
      rule: 'Follow the checklist.',
      scripts: [],
      usesSkillIds: ['child-1'],
    });
    expect(mockGetModelById).toHaveBeenCalledWith({ id: SKILL_ID });
  });

  it('should throw NotFoundError when skill is missing or inactive', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        id: SKILL_ID,
        enabled: false,
      },
    });

    await expect(getActiveRuleById({ skillId: SKILL_ID })).rejects.toThrow(NotFoundError);
  });
});
