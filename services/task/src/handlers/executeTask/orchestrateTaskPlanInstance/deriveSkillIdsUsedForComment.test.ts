import { describe, it, expect } from 'vitest';

import { TaskPlanInstanceStatus } from '@vassembly/domain-task-plan-instance/src/model';

import { deriveSkillIdsUsedForComment } from './deriveSkillIdsUsedForComment';

describe('deriveSkillIdsUsedForComment', () => {
  it('should return deduplicated non-null skill ids from instance items', () => {
    const skillIds = deriveSkillIdsUsedForComment({
      items: [
        {
          templateItemIndex: 0,
          agentId: '507f1f77bcf86cd799439011',
          skillId: 'skill-a',
          order: 1,
          status: TaskPlanInstanceStatus.Done,
          startedAt: null,
          completedAt: null,
          failedAt: null,
          output: null,
          errorMessage: null,
          retryCount: 0,
        },
        {
          templateItemIndex: 1,
          agentId: '507f1f77bcf86cd799439012',
          skillId: 'skill-a',
          order: 2,
          status: TaskPlanInstanceStatus.Done,
          startedAt: null,
          completedAt: null,
          failedAt: null,
          output: null,
          errorMessage: null,
          retryCount: 0,
        },
        {
          templateItemIndex: 2,
          agentId: '507f1f77bcf86cd799439013',
          skillId: null,
          order: 3,
          status: TaskPlanInstanceStatus.Pending,
          startedAt: null,
          completedAt: null,
          failedAt: null,
          output: null,
          errorMessage: null,
          retryCount: 0,
        },
      ],
    });

    expect(skillIds).toEqual(['skill-a']);
  });
});
