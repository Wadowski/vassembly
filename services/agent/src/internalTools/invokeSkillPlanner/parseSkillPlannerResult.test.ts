import { describe, expect, it } from 'vitest';

import { ValidationError } from '@vassembly/errors';

import { parseSkillPlannerResult } from './parseSkillPlannerResult';

describe('parseSkillPlannerResult', () => {
  it('should return skillId and isNew when final line is valid create JSON', () => {
    const result = parseSkillPlannerResult({
      message: 'Skill created.\n{"skillId":"skill-1","isNew":true}',
    });

    expect(result).toEqual({ action: 'create', skillId: 'skill-1', isNew: true });
  });

  it('should return reuse action when planner recommends existing skill', () => {
    const result = parseSkillPlannerResult({
      message:
        '{"action":"reuse","skillName":"contract-review","fitScore":0.85,"refinements":"focus on indemnity"}',
    });

    expect(result).toEqual({
      action: 'reuse',
      skillName: 'contract-review',
      fitScore: 0.85,
      refinements: 'focus on indemnity',
    });
  });

  it('should return compose action when planner recommends skill composition', () => {
    const result = parseSkillPlannerResult({
      message: '{"action":"compose","skillNames":["document-extract","contract-review"],"fitScore":0.75}',
    });

    expect(result).toEqual({
      action: 'compose',
      skillNames: ['document-extract', 'contract-review'],
      fitScore: 0.75,
    });
  });

  it('should throw ValidationError when message has no valid JSON', () => {
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
