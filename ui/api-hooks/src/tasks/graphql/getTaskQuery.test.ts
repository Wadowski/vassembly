import { describe, expect, it } from 'vitest';

import { GET_TASK_QUERY } from './getTaskQuery';

const TASK_FIELDS = [
  'id',
  'userId',
  'description',
  'type',
  'status',
  'agentAssignedId',
  'title',
  'specializationIds',
  'llmResponse',
  'errorMessage',
  'errorCode',
  'startedAt',
  'completedAt',
  'failedAt',
  'createdAt',
  'updatedAt',
] as const;

describe('GET_TASK_QUERY', () => {
  it('should export a GraphQL query document string', () => {
    expect(typeof GET_TASK_QUERY).toBe('string');
    expect(GET_TASK_QUERY.trim().length).toBeGreaterThan(0);
  });

  it('should declare GetTask operation with required id variable of type ID', () => {
    expect(GET_TASK_QUERY).toMatch(/query\s+GetTask\s*\(\s*\$id:\s*ID!\s*\)/);
  });

  it('should query task field with id argument bound to the id variable', () => {
    expect(GET_TASK_QUERY).toMatch(/task\s*\(\s*id:\s*\$id\s*\)/);
  });

  it('should include all TaskFields in the task selection set', () => {
    for (const field of TASK_FIELDS) {
      expect(GET_TASK_QUERY).toMatch(new RegExp(`\\b${field}\\b`));
    }
  });
});
