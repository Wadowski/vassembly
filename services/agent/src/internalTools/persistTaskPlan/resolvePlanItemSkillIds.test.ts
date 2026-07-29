import { ValidationError } from '@vassembly/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolvePlanItemSkillIds } from './resolvePlanItemSkillIds';

const mockGetActiveRuleByName = vi.hoisted(() => vi.fn());

vi.mock('@vassembly/domain-skill', () => ({
  default: {
    queries: {
      getActiveRuleByName: mockGetActiveRuleByName,
    },
  },
}));

describe('resolvePlanItemSkillIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve skillName to skillId when skill exists', async () => {
    mockGetActiveRuleByName.mockResolvedValue({ skillId: 'skill-1' });

    const result = await resolvePlanItemSkillIds({
      specializationIds: ['spec-1'],
      items: [
        {
          skillId: null,
          skillName: 'contract-review',
          description: 'Review the contract',
        },
      ],
    });

    expect(result[0]?.skillId).toBe('skill-1');
  });

  it('should throw ValidationError when skillName does not resolve to an existing skill', async () => {
    mockGetActiveRuleByName.mockRejectedValue(new Error('not found'));

    await expect(
      resolvePlanItemSkillIds({
        specializationIds: ['spec-1'],
        items: [
          {
            skillId: null,
            skillName: 'unknown-skill',
            description: 'Review the contract',
          },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should keep skillId null when planning a new skill', async () => {
    const result = await resolvePlanItemSkillIds({
      specializationIds: ['spec-1'],
      items: [
        {
          skillId: null,
          description: 'Summarize legal text using a reusable prompt skill',
        },
      ],
    });

    expect(result[0]?.skillId).toBeNull();
    expect(result[0]?.description).toContain('Summarize legal text');
  });
});
