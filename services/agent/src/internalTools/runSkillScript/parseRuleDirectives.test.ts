import { describe, expect, it } from 'vitest';

import { parseRuleDirectives } from './parseRuleDirectives';

describe('parseRuleDirectives', () => {
  it('should return run_skill_script directive matches', () => {
    const matches = parseRuleDirectives({
      skillName: 'contract-review',
      rule: 'Step 1\nrun_skill_script scripts/validate.py\nStep 2',
      scripts: [{ filename: 'scripts/validate.py' }],
    });

    expect(matches).toEqual([
      { skillName: 'contract-review', filename: 'scripts/validate.py' },
    ]);
  });

  it('should return empty array when no directive is present', () => {
    const matches = parseRuleDirectives({
      skillName: 'contract-review',
      rule: 'Only prose instructions',
      scripts: [{ filename: 'scripts/validate.py' }],
    });

    expect(matches).toEqual([]);
  });
});
