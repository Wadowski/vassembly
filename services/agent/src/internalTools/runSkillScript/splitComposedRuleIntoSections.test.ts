import { describe, expect, it } from 'vitest';

import { splitComposedRuleIntoSections } from './splitComposedRuleIntoSections';

describe('splitComposedRuleIntoSections', () => {
  it('should return a single section for a leaf rule', () => {
    const sections = splitComposedRuleIntoSections({
      rule: 'run_skill_script scripts/validate.py',
      rootSkillName: 'contract-review',
    });

    expect(sections).toEqual([
      {
        skillName: 'contract-review',
        content: 'run_skill_script scripts/validate.py',
      },
    ]);
  });

  it('should split composed rules by referenced skill headings', () => {
    const sections = splitComposedRuleIntoSections({
      rule: [
        'run_skill_script scripts/parent.py',
        '',
        '## Referenced skill: contract-review',
        '',
        'run_skill_script scripts/child.py',
      ].join('\n'),
      rootSkillName: 'contract-processor',
    });

    expect(sections).toEqual([
      {
        skillName: 'contract-processor',
        content: 'run_skill_script scripts/parent.py',
      },
      {
        skillName: 'contract-review',
        content: 'run_skill_script scripts/child.py',
      },
    ]);
  });
});
