import { describe, expect, it } from 'vitest';

import { mapTaskProgressDocument } from './mapTaskProgressDocument';

describe('mapTaskProgressDocument', () => {
  it('should map _id to id when id is missing', () => {
    const result = mapTaskProgressDocument({
      document: {
        _id: 'mongo-object-id',
        taskId: 'task-123',
      },
    });

    expect(result.id).toBe('mongo-object-id');
    expect(result.taskId).toBe('task-123');
  });

  it('should keep existing id when present', () => {
    const result = mapTaskProgressDocument({
      document: {
        _id: 'mongo-object-id',
        id: 'explicit-id',
        taskId: 'task-123',
      },
    });

    expect(result.id).toBe('explicit-id');
  });
});
