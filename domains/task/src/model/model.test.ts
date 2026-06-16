import { describe, it, expect } from 'vitest';

import { TaskStatus } from './model';

describe('TaskStatus enum', () => {
  it('should include Failed status with value failed', () => {
    expect(TaskStatus.Failed).toBe('failed');
  });

  it('should include all five task statuses', () => {
    expect(Object.values(TaskStatus).sort()).toEqual(
      ['created', 'done', 'failed', 'in-progress', 'paused'].sort(),
    );
  });
});
