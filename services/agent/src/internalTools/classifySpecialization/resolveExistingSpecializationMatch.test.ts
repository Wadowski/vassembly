import { describe, expect, it } from 'vitest';

import { resolveExistingSpecializationMatch } from './resolveExistingSpecializationMatch';

const CATALOG_ITEMS = [
  { id: 'spec-food', name: 'food & nutrition' },
  { id: 'spec-notion', name: 'notion' },
];

describe('resolveExistingSpecializationMatch', () => {
  it('should match food to food & nutrition', () => {
    const specializationId = resolveExistingSpecializationMatch({
      candidate: 'food',
      catalogItems: CATALOG_ITEMS,
    });

    expect(specializationId).toBe('spec-food');
  });

  it('should match exact specialization names', () => {
    const specializationId = resolveExistingSpecializationMatch({
      candidate: 'notion',
      catalogItems: CATALOG_ITEMS,
    });

    expect(specializationId).toBe('spec-notion');
  });
});
