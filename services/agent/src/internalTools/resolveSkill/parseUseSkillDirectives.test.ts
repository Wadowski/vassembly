import { describe, it, expect } from 'vitest';

import { parseUseSkillDirectives } from './parseUseSkillDirectives';

describe('parseUseSkillDirectives', () => {
  it('should parse use skill directive with optional modifier by default', () => {
    const directives = parseUseSkillDirectives({
      rule: 'Step one.\nuse skill contract-review\nStep two.',
    });

    expect(directives).toEqual([
      {
        raw: 'use skill contract-review',
        skillName: 'contract-review',
        required: false,
      },
    ]);
  });

  it('should parse required and optional modifiers', () => {
    const directives = parseUseSkillDirectives({
      rule: 'use skill alpha required\nuse skill beta optional',
    });

    expect(directives).toEqual([
      {
        raw: 'use skill alpha required',
        skillName: 'alpha',
        required: true,
      },
      {
        raw: 'use skill beta optional',
        skillName: 'beta',
        required: false,
      },
    ]);
  });
});
