import { describe, expect, it } from 'vitest';

import { ValidationError } from '@vassembly/errors';

import { parseSkillPlannerResult } from './parseSkillPlannerResult';

describe('parseSkillPlannerResult', () => {
  it('should return skillId and isNew when final line is valid JSON', () => {
    const result = parseSkillPlannerResult({
      message: 'Skill created.\n{"skillId":"skill-1","isNew":true}',
    });

    expect(result).toEqual({ skillId: 'skill-1', isNew: true });
  });

  it('should throw ValidationError when message has no create_skill JSON', () => {
    expect(() =>
      parseSkillPlannerResult({
        message: 'Skill created without JSON footer.',
      }),
    ).toThrow(ValidationError);
  });

  it('should throw ValidationError when message is empty', () => {
    expect(() =>
      parseSkillPlannerResult({
        message: '   ',
      }),
    ).toThrow(ValidationError);
  });
});
