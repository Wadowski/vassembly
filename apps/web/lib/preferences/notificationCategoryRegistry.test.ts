import { describe, expect, it } from 'vitest';

import { getVisibleCategories } from './notificationCategoryRegistry';

describe('notificationCategoryRegistry', () => {
  it('shows only admin-facing categories when the role is admin', () => {
    const adminSliceIdentifiers = getVisibleCategories({ userRole: 'admin' }).map(({ id }) => id);
    expect(adminSliceIdentifiers).toContain('operational');
    expect(adminSliceIdentifiers).toContain('safety');
    expect(adminSliceIdentifiers).toHaveLength(2);
  });

  it('hides admin categories for non-admin roles regardless of casing', () => {
    const workerIdentifiers = getVisibleCategories({ userRole: 'WORKER' }).map(({ id }) => id);
    expect(workerIdentifiers).toEqual([]);
  });
});
