import { describe, expect, it } from 'vitest';

import { resolveSkillSchema } from './resolveSkillSchema';

describe('resolveSkillSchema', () => {
  it('should accept skillName with optional specializationId', () => {
    const result = resolveSkillSchema.safeParse({
      skillName: 'contract-review',
      specializationId: 'spec-1',
    });

    expect(result.success).toBe(true);
  });

  it('should accept skillName without specializationId', () => {
    const result = resolveSkillSchema.safeParse({
      skillName: 'contract-review',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty skillName', () => {
    const result = resolveSkillSchema.safeParse({
      skillName: '',
    });

    expect(result.success).toBe(false);
  });
});
