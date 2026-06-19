import { describe, expect, it } from 'vitest';

import { TaskStatus } from './types';
import { isTaskDetailPollable } from './isTaskDetailPollable';

describe('isTaskDetailPollable', () => {
  it('should return true for in-progress and waiting statuses', () => {
    expect(isTaskDetailPollable(TaskStatus.InProgress)).toBe(true);
    expect(isTaskDetailPollable(TaskStatus.Waiting)).toBe(true);
  });

  it('should return false for terminal and idle statuses', () => {
    expect(isTaskDetailPollable(TaskStatus.Created)).toBe(false);
    expect(isTaskDetailPollable(TaskStatus.Paused)).toBe(false);
    expect(isTaskDetailPollable(TaskStatus.Done)).toBe(false);
    expect(isTaskDetailPollable(TaskStatus.Failed)).toBe(false);
  });
});
