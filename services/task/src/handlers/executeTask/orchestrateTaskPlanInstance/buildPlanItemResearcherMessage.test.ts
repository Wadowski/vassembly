import { describe, expect, it } from 'vitest';

import { buildPlanItemResearcherMessage } from './buildPlanItemResearcherMessage';

describe('buildPlanItemResearcherMessage', () => {
  it('should frame the item as data gathering with context', () => {
    const message = buildPlanItemResearcherMessage({
      templateItemIndex: 2,
      description: 'Collect market pricing for EU SaaS contracts',
      inputSlice: { contractType: 'NDA' },
    });

    expect(message).toContain('Gather data for plan item 3.');
    expect(message).toContain('Data to collect: Collect market pricing for EU SaaS contracts');
    expect(message).toContain('{"contractType":"NDA"}');
    expect(message).toContain('data-gathering script skill');
  });
});
