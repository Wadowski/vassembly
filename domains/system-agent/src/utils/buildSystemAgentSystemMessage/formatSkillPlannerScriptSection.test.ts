import { describe, expect, it } from 'vitest';

import {
  formatSkillPlannerReuseSection,
} from './formatSkillPlannerScriptSection';

describe('formatSkillPlannerReuseSection', () => {
  it('should reinforce prompt-only skills as the default', () => {
    const section = formatSkillPlannerReuseSection();

    expect(section).toContain('default to an empty scripts[] (prompt-only skill)');
    expect(section).toContain('Only call a script creator when');
  });
});
