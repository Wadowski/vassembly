import { describe, it, expect } from 'vitest';

import { TaskPlanInstanceStatus } from '../../model';
import { deriveInstanceStatus } from './deriveInstanceStatus';

import type { TaskPlanInstanceItem } from '../../model';

const buildItem = (partial: Partial<TaskPlanInstanceItem>): TaskPlanInstanceItem => ({
  templateItemIndex: 0,
  agentId: '507f1f77bcf86cd799439011',
  skillId: null,
  order: 1,
  status: TaskPlanInstanceStatus.Pending,
  startedAt: null,
  completedAt: null,
  failedAt: null,
  output: null,
  errorMessage: null,
  retryCount: 0,
  ...partial,
});

describe('deriveInstanceStatus', () => {
  it('should return failed when any item is failed', () => {
    const status = deriveInstanceStatus({
      items: [
        buildItem({ templateItemIndex: 0, status: TaskPlanInstanceStatus.Done }),
        buildItem({ templateItemIndex: 1, status: TaskPlanInstanceStatus.Failed }),
      ],
    });

    expect(status).toBe(TaskPlanInstanceStatus.Failed);
  });

  it('should return done when all items are done', () => {
    const status = deriveInstanceStatus({
      items: [
        buildItem({ templateItemIndex: 0, status: TaskPlanInstanceStatus.Done }),
        buildItem({ templateItemIndex: 1, status: TaskPlanInstanceStatus.Done }),
      ],
    });

    expect(status).toBe(TaskPlanInstanceStatus.Done);
  });

  it('should return in-progress when any item has started but not all are terminal', () => {
    const status = deriveInstanceStatus({
      items: [
        buildItem({ templateItemIndex: 0, status: TaskPlanInstanceStatus.Done }),
        buildItem({ templateItemIndex: 1, status: TaskPlanInstanceStatus.InProgress }),
      ],
    });

    expect(status).toBe(TaskPlanInstanceStatus.InProgress);
  });

  it('should return pending when all items are pending', () => {
    const status = deriveInstanceStatus({
      items: [
        buildItem({ templateItemIndex: 0, status: TaskPlanInstanceStatus.Pending }),
        buildItem({ templateItemIndex: 1, status: TaskPlanInstanceStatus.Pending }),
      ],
    });

    expect(status).toBe(TaskPlanInstanceStatus.Pending);
  });
});
