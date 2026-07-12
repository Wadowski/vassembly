import { describe, it, expect } from 'vitest';

import { ValidationError } from '@vassembly/errors';

import { detectCompositionCycle } from './detectCompositionCycle';

describe('detectCompositionCycle', () => {
  it('should not throw for acyclic dependency graph', () => {
    expect(() =>
      detectCompositionCycle({
        skillId: 'a',
        usesSkillIds: ['b'],
        allSkills: [
          { id: 'a', usesSkillIds: ['b'] },
          { id: 'b', usesSkillIds: [] },
        ],
      }),
    ).not.toThrow();
  });

  it('should throw ValidationError when cycle is detected', () => {
    expect(() =>
      detectCompositionCycle({
        skillId: 'a',
        usesSkillIds: ['b'],
        allSkills: [
          { id: 'a', usesSkillIds: ['b'] },
          { id: 'b', usesSkillIds: ['a'] },
        ],
      }),
    ).toThrow(ValidationError);
  });
});
