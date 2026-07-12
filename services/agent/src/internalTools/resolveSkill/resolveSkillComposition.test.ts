import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const { mockGetActiveRuleById, mockGetActiveRuleByName } = vi.hoisted(() => ({
  mockGetActiveRuleById: vi.fn(),
  mockGetActiveRuleByName: vi.fn(),
}));

vi.mock('@vassembly/domain-skill', () => ({
  default: {
    queries: {
      getActiveRuleById: mockGetActiveRuleById,
      getActiveRuleByName: mockGetActiveRuleByName,
    },
  },
}));

import { resolveSkillComposition } from './resolveSkillComposition';

describe('resolveSkillComposition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return leaf skill rule when no directives are present', async () => {
    mockGetActiveRuleById.mockResolvedValue({
      skillId: 'skill-1',
      specializationId: 'spec-1',
      name: 'contract-review',
      rule: 'Follow the checklist.',
      scripts: [],
      usesSkillIds: [],
    });

    const result = await resolveSkillComposition({ skillId: 'skill-1' });

    expect(result).toEqual({
      name: 'contract-review',
      rule: 'Follow the checklist.',
      scripts: [],
    });
  });

  it('should inline child skill rule from use skill directive', async () => {
    mockGetActiveRuleById
      .mockResolvedValueOnce({
        skillId: 'parent-1',
        specializationId: 'spec-1',
        name: 'contract-processor',
        rule: 'Before.\nuse skill contract-review\nAfter.',
        scripts: [{ filename: 'scripts/parent.py', language: 'python', storageKey: 'k1' }],
        usesSkillIds: ['child-1'],
      })
      .mockResolvedValueOnce({
        skillId: 'child-1',
        specializationId: 'spec-1',
        name: 'contract-review',
        rule: 'Child rule.',
        scripts: [{ filename: 'scripts/child.py', language: 'python', storageKey: 'k2' }],
        usesSkillIds: [],
      });

    mockGetActiveRuleByName.mockResolvedValue({ skillId: 'child-1' });

    const result = await resolveSkillComposition({ skillId: 'parent-1' });

    expect(result.rule).toContain('## Referenced skill: contract-review');
    expect(result.rule).toContain('Child rule.');
    expect(result.scripts).toHaveLength(2);
    expect(result.scripts[0]).toMatchObject({
      filename: 'scripts/parent.py',
      skillId: 'parent-1',
      skillName: 'contract-processor',
    });
    expect(result.scripts[1]).toMatchObject({
      filename: 'scripts/child.py',
      skillId: 'child-1',
      skillName: 'contract-review',
    });
  });

  it('should throw ValidationError when composition depth limit is exceeded', async () => {
    mockGetActiveRuleById.mockImplementation(async ({ skillId }: { skillId: string }) => ({
      skillId,
      specializationId: 'spec-1',
      name: skillId,
      rule: `use skill ${skillId}-next`,
      scripts: [],
      usesSkillIds: [],
    }));
    mockGetActiveRuleByName.mockImplementation(async ({ skillName }: { skillName: string }) => ({
      skillId: `${skillName}-id`,
    }));

    await expect(resolveSkillComposition({ skillId: 'level-0' })).rejects.toThrow(ValidationError);
  });
});
