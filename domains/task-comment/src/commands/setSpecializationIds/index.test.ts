import { describe, expect, it, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockPersist } = vi.hoisted(() => ({
  mockPersist: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskCommentMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  updateDbById: vi.fn(() => mockPersist),
}));

import { setSpecializationIds } from './index';

describe('setSpecializationIds command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPersist.mockImplementation((args: { id: string; data: { specializationIds: string[] } }) =>
      Promise.resolve({
        data: {
          id: args.id,
          specializationIds: args.data.specializationIds,
        },
      }),
    );
  });

  it('should accept up to five specialization IDs', async () => {
    const specializationIds = [
      'spec-1',
      'spec-2',
      'spec-3',
      'spec-4',
      'spec-5',
    ];

    const result = await setSpecializationIds({
      commentId: 'comment-1',
      specializationIds,
    });

    expect(result.data?.specializationIds).toEqual(specializationIds);
  });

  it('should reject a sixth specialization ID with ValidationError', async () => {
    await expect(
      setSpecializationIds({
        commentId: 'comment-1',
        specializationIds: [
          'spec-1',
          'spec-2',
          'spec-3',
          'spec-4',
          'spec-5',
          'spec-6',
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });
});
