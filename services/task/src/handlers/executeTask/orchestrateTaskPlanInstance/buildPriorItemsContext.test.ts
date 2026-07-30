import { describe, expect, it } from 'vitest';

import { buildPriorItemsContext } from './buildPriorItemsContext';

describe('buildPriorItemsContext', () => {
  it('should return none when there are no prior items', () => {
    expect(buildPriorItemsContext({ priorItems: [] })).toBe('none');
  });

  it('should format prior item goals and outputs', () => {
    const context = buildPriorItemsContext({
      priorItems: [
        {
          templateItemIndex: 0,
          description: 'Draft the report',
          output: { message: 'done' },
        },
      ],
    });

    expect(context).toContain('Item 1 — Goal: Draft the report');
    expect(context).toContain('"message":"done"');
  });
});
