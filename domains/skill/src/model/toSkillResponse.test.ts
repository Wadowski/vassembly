import { describe, it, expect } from 'vitest';

import type { SkillModel } from './model';
import { toSkillResponse } from './toSkillResponse';

describe('toSkillResponse', () => {
  it('should map removedAt to nullable ISO string', () => {
    const removedAt = new Date('2026-04-01T12:00:00.000Z');

    const result = toSkillResponse({
      skill: {
        id: 'skill-1',
        specializationId: 'spec-1',
        name: 'contract-review',
        description: 'Review contracts',
        rule: 'Follow checklist',
        enabled: true,
        scripts: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        removedAt,
      } as unknown as SkillModel,
    });

    expect(result.removedAt).toBe('2026-04-01T12:00:00.000Z');
  });

  it('should return null removedAt for active skills', () => {
    const result = toSkillResponse({
      skill: {
        id: 'skill-1',
        specializationId: 'spec-1',
        name: 'contract-review',
        description: 'Review contracts',
        rule: 'Follow checklist',
        enabled: true,
        scripts: [],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        removedAt: null,
      } as unknown as SkillModel,
    });

    expect(result.removedAt).toBeNull();
  });
});
