import { describe, it, expect } from 'vitest';

import { TaskStatus } from './model';

describe('TaskStatus enum', () => {
  it('should include Failed status with value failed', () => {
    expect(TaskStatus.Failed).toBe('failed');
  });

  it('should include all six task statuses', () => {
    expect(Object.values(TaskStatus).sort()).toEqual(
      ['created', 'done', 'failed', 'in-progress', 'paused', 'waiting'].sort(),
    );
  });
});
