import { describe, it, expect } from 'vitest';

import { TaskPlanInstanceStatus } from '@vassembly/domain-task-plan-instance/src/model';

import { groupItemsByOrder } from './groupItemsByOrder';

import type { TaskPlanInstanceItem } from '@vassembly/domain-task-plan-instance/src/model';

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

describe('groupItemsByOrder', () => {
  it('should group items by ascending order with parallel items in the same group', () => {
    const groups = groupItemsByOrder({
      items: [
        buildItem({ templateItemIndex: 0, order: 2 }),
        buildItem({ templateItemIndex: 1, order: 1 }),
        buildItem({ templateItemIndex: 2, order: 1 }),
      ],
    });

    expect(groups).toHaveLength(2);
    expect(groups[0]?.map((item) => item.templateItemIndex).sort()).toEqual([1, 2]);
    expect(groups[1]?.map((item) => item.templateItemIndex)).toEqual([0]);
  });
});
