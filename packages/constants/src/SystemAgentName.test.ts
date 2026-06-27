import { describe, expect, it } from 'vitest';

import { SYSTEM_AGENT_NAME } from './SystemAgentName';

describe('SYSTEM_AGENT_NAME', () => {
  it('should define all seeded platform agents', () => {
    expect(Object.values(SYSTEM_AGENT_NAME)).toEqual([
      'Assistant',
      'Intent classifier',
      'Question worker',
      'Task worker',
      'Scheduled task worker',
      'Routine task worker',
      'Task title generator',
      'Specialization classifier',
      'MCP specialization classifier',
      'Specialization agent description generator',
      'Skill resolver',
    ]);
  });
});
