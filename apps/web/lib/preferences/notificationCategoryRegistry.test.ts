import { describe, expect, it } from 'vitest';

import { getVisibleCategories } from './notificationCategoryRegistry';

describe('notificationCategoryRegistry', () => {
  it('shows only worker-facing categories when the role is worker', () => {
    const workerSliceIdentifiers = getVisibleCategories({ userRole: 'worker' }).map(({ id }) => id);
    expect(workerSliceIdentifiers).toContain('operational');
    expect(workerSliceIdentifiers.includes('team')).toBe(false);
    expect(workerSliceIdentifiers).toHaveLength(2);
  });

  it('shows supervisor-exclusive categories regardless of casing', () => {
    const supervisorIdentifiers = getVisibleCategories({ userRole: 'SUPERVISOR' }).map(
      ({ id }) => id,
    );
    expect(supervisorIdentifiers).toContain('team');
    expect(supervisorIdentifiers.includes('team')).toBe(true);
    expect(supervisorIdentifiers.length >= 4).toBe(true);
  });
});
