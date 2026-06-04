import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetById } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskMongodbDao: {},
}));

vi.mock('@vassembly/queries', () => ({
  getDbById: vi.fn(() => mockGetById),
}));

import { getModelById } from './index';

describe('getModelById query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return raw TaskModel from database by id', async () => {
    const taskModel = {
      id: 'task-1',
      userId: 'user-1',
      description: 'Do work',
      type: 'user',
      status: 'in-progress',
      agentAssignedId: 'agent-1',
    };

    mockGetById.mockResolvedValue({ data: taskModel });

    const result = await getModelById({ id: 'task-1' });

    expect(mockGetById).toHaveBeenCalledWith({ id: 'task-1' });
    expect(result.data).toEqual(taskModel);
  });
});
