import { describe, expect, it } from 'vitest';

import { SYSTEM_AGENT_NAME } from './SystemAgentName';

describe('SYSTEM_AGENT_NAME', () => {
  it('should define all seeded platform agents', () => {
    expect(Object.values(SYSTEM_AGENT_NAME)).toEqual([
      'Assistant',
      'Intent classifier',
      // 'Question worker', // TEMPORARILY DISABLED — task-category-only-mode
      'Task worker',
      // 'Scheduled task worker', // TEMPORARILY DISABLED — task-category-only-mode
      // 'Routine task worker', // TEMPORARILY DISABLED — task-category-only-mode
      'Task title generator',
      'Specialization classifier',
      'MCP specialization classifier',
      'Specialization agent description generator',
      'Specialization agent rule generator',
      'Skill resolver',
      'Task planner',
      'Skill planner',
      'Skill script creator (python)',
      'Skill script creator (javascript)',
      'Skill script creator (bash)',
    ]);
  });
});
