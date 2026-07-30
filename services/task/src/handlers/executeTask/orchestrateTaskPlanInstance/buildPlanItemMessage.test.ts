import { describe, expect, it } from 'vitest';

import { buildPlanItemMessage } from './buildPlanItemMessage';

describe('buildPlanItemMessage', () => {
  const baseParams = {
    templateItemIndex: 0,
    description: 'Complete the task',
    skillId: null,
    skillName: null,
    inputSlice: { goal: 'test' },
    priorItemsContext: 'none',
  };

  it('should build worker messages with skill execution framing', () => {
    const message = buildPlanItemMessage({ ...baseParams, role: 'worker' });

    expect(message).toContain('Execute plan item 1');
    expect(message).toContain('Skills to use:');
  });

  it('should build validator messages with prior results context', () => {
    const message = buildPlanItemMessage({
      ...baseParams,
      role: 'validator',
      priorItemsContext: 'Item 1 — Goal: Draft\nOutput: {}',
    });

    expect(message).toContain('Validate plan item 1');
    expect(message).toContain('Prior results:');
    expect(message).toContain('Item 1 — Goal: Draft');
  });

  it('should build researcher messages for data gathering', () => {
    const message = buildPlanItemMessage({ ...baseParams, role: 'researcher' });

    expect(message).toContain('Gather data for plan item 1');
    expect(message).toContain('Data to collect: Complete the task');
  });
});
