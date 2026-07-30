import { describe, expect, it } from 'vitest';

import { buildPlanItemValidatorMessage } from './buildPlanItemValidatorMessage';

describe('buildPlanItemValidatorMessage', () => {
  it('should include prior items context for validation', () => {
    const message = buildPlanItemValidatorMessage({
      templateItemIndex: 1,
      description: 'Verify that summary was produced',
      priorItemsContext:
        'Item 1 — Goal: Summarize contract\nOutput: {"message":"done"}',
    });

    expect(message).toContain('Validate plan item 2.');
    expect(message).toContain('Goal to verify: Verify that summary was produced');
    expect(message).toContain('Prior results:');
    expect(message).toContain('Item 1 — Goal: Summarize contract');
  });
});
