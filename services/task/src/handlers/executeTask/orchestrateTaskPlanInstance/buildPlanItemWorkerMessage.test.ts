import { describe, expect, it } from 'vitest';

import { buildPlanItemWorkerMessage } from './buildPlanItemWorkerMessage';

describe('buildPlanItemWorkerMessage', () => {
  it('should include skill fields for orchestrated worker execution', () => {
    const message = buildPlanItemWorkerMessage({
      templateItemIndex: 0,
      description: 'Summarize the contract',
      skillId: 'skill-1',
      skillName: 'contract-review',
      inputSlice: { goal: 'Review NDA' },
    });

    expect(message).toContain('Skills to use: contract-review');
    expect(message).toContain('New skill needed: none');
    expect(message).toContain('Goal: Summarize the contract');
  });

  it('should treat null skillId as new skill needed using description', () => {
    const message = buildPlanItemWorkerMessage({
      templateItemIndex: 1,
      description: 'Build a custom scraper for court filings',
      skillId: null,
      skillName: null,
      inputSlice: {},
    });

    expect(message).toContain('Skills to use: none');
    expect(message).toContain('New skill needed: Build a custom scraper for court filings');
  });
});
