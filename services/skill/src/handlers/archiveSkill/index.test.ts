import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ForbiddenError, NotFoundError } from '@vassembly/errors';

const { mockAssertHasRole, mockGetById, mockRemoveSoft } = vi.hoisted(() => ({
  mockAssertHasRole: vi.fn(),
  mockGetById: vi.fn(),
  mockRemoveSoft: vi.fn(),
}));

vi.mock('@vassembly/domain-user', () => ({
  default: {
    queries: {
      assertHasRole: mockAssertHasRole,
    },
  },
}));

vi.mock('@vassembly/domain-skill', () => ({
  toSkillResponse: vi.fn(({ skill }: { skill: Record<string, unknown> }) => ({
    id: skill.id,
    specializationId: skill.specializationId,
    name: skill.name,
    description: skill.description,
    rule: skill.rule,
    enabled: skill.enabled,
    scripts: skill.scripts ?? [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    removedAt:
      skill.removedAt instanceof Date
        ? skill.removedAt.toISOString()
        : (skill.removedAt as string | null),
  })),
  default: {
    commands: {
      removeSoft: mockRemoveSoft,
    },
    queries: {
      getById: mockGetById,
    },
  },
}));

import { archiveSkill } from './index';

const ACTIVE_SKILL = {
  id: 'skill-1',
  specializationId: 'spec-1',
  name: 'contract-review',
  description: 'Review contracts',
  rule: 'Follow checklist',
  enabled: true,
  scripts: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  removedAt: null,
};

describe('archiveSkill handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertHasRole.mockResolvedValue(undefined);
    mockGetById.mockResolvedValue({ data: ACTIVE_SKILL });
  });

  it('should return archived skill when admin archives active skill', async () => {
    mockRemoveSoft.mockResolvedValue({
      data: {
        ...ACTIVE_SKILL,
        removedAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    });

    const result = await archiveSkill({
      adminUserId: 'admin-1',
      skillId: 'skill-1',
    });

    expect(result.skill.removedAt).not.toBeNull();
    expect(mockRemoveSoft).toHaveBeenCalledWith({ id: 'skill-1' });
  });

  it('should throw ForbiddenError when caller is not admin', async () => {
    mockAssertHasRole.mockRejectedValue(new ForbiddenError('Admin access required'));

    await expect(
      archiveSkill({
        adminUserId: 'user-1',
        skillId: 'skill-1',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should throw NotFoundError when skill does not exist', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Skill not found'));

    await expect(
      archiveSkill({
        adminUserId: 'admin-1',
        skillId: 'missing-id',
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
