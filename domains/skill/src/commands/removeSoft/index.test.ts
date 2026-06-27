import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InternalError, NotFoundError, WrongParamError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockRemoveSoft, mockGetModelById } = vi.hoisted(() => ({
  mockRemoveSoft: vi.fn(),
  mockGetModelById: vi.fn(),
}));

vi.mock('../../clients', () => ({
  skillMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  removeSoftDb: vi.fn(() => mockRemoveSoft),
}));

vi.mock('../../queries/getModelById', () => ({
  getModelById: mockGetModelById,
}));

vi.mock('../../model', () => ({
  SkillModel: class SkillModel {},
  skillFactory: {
    create: vi.fn((row: Record<string, unknown>) => row),
  },
}));

import { removeSoft } from './index';

const SKILL_ID = '507f1f77bcf86cd799439011';

const buildActiveSkill = () => ({
  id: SKILL_ID,
  specializationId: 'spec-1',
  name: 'contract-review',
  description: 'Review contracts',
  rule: 'Follow the checklist.',
  enabled: true,
  scripts: [],
  removedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('removeSoft skill command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set removedAt timestamp when archiving active skill', async () => {
    const removedAt = new Date('2026-04-01T11:30:00.000Z');
    mockGetModelById.mockResolvedValue({ data: buildActiveSkill() });
    mockRemoveSoft.mockResolvedValue({
      data: {
        ...buildActiveSkill(),
        removedAt,
        updatedAt: removedAt,
      },
    });

    const result = await removeSoft({ id: SKILL_ID });

    expect(result.data.removedAt).toEqual(removedAt);
  });

  it('should throw NotFoundError when skill not found', async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError('Skill not found'));

    await expect(removeSoft({ id: 'missing-id' })).rejects.toThrow(NotFoundError);
  });

  it('should reject archive when skill is already archived', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...buildActiveSkill(),
        removedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    await expect(removeSoft({ id: SKILL_ID })).rejects.toThrow(WrongParamError);
  });

  it('should reject removal when persistence fails unexpectedly', async () => {
    mockGetModelById.mockResolvedValue({ data: buildActiveSkill() });
    mockRemoveSoft.mockRejectedValue(new InternalError('Database unavailable'));

    await expect(removeSoft({ id: SKILL_ID })).rejects.toThrow(InternalError);
  });
});
