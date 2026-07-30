import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const {
  mockGetModelById,
  mockSetSpecializationIds,
  mockClassifySpecializationToolHandler,
  mockCreateSpecializationToolHandler,
  mockBuildCommentClassificationMessage,
  mockAggregateTaskSpecializationIds,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockSetSpecializationIds: vi.fn(),
  mockClassifySpecializationToolHandler: vi.fn(),
  mockCreateSpecializationToolHandler: vi.fn(),
  mockBuildCommentClassificationMessage: vi.fn(),
  mockAggregateTaskSpecializationIds: vi.fn(),
}));

vi.mock('@vassembly/domain-task-comment', () => ({
  default: {
    queries: {
      getModelById: mockGetModelById,
    },
    commands: {
      setSpecializationIds: mockSetSpecializationIds,
    },
  },
}));

vi.mock('@vassembly/service-agent', () => ({
  classifySpecializationToolHandler: mockClassifySpecializationToolHandler,
  createSpecializationToolHandler: mockCreateSpecializationToolHandler,
}));

vi.mock('./buildCommentClassificationMessage', () => ({
  buildCommentClassificationMessage: mockBuildCommentClassificationMessage,
}));

vi.mock('./aggregateTaskSpecializationIds', () => ({
  aggregateTaskSpecializationIds: mockAggregateTaskSpecializationIds,
}));

import { classifyCommentSpecializations } from './index';

describe('classifyCommentSpecializations handler', () => {
  let persistedSpecializationIds: string[] | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    persistedSpecializationIds = undefined;
    mockGetModelById.mockResolvedValue({
      data: {
        id: 'comment-1',
        specializationIds: [],
      },
    });
    mockBuildCommentClassificationMessage.mockResolvedValue(
      'Review legal docs and update Airtable workspace',
    );
    mockSetSpecializationIds.mockImplementation(async ({ specializationIds }) => {
      persistedSpecializationIds = specializationIds;
      return { data: { id: 'comment-1', specializationIds } };
    });
    mockAggregateTaskSpecializationIds.mockResolvedValue(undefined);
    mockCreateSpecializationToolHandler
      .mockResolvedValueOnce(
        JSON.stringify({ specializationId: 'spec-airtable', isNew: true }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({ specializationId: 'spec-compliance', isNew: true }),
      );
  });

  it('should persist combined existing and newly created specialization IDs for mixed classification results', async () => {
    mockClassifySpecializationToolHandler.mockResolvedValue(
      JSON.stringify({
        type: 'classified',
        existingSpecializationIds: ['spec-legal'],
        newSpecializations: [
          { name: 'airtable', description: 'Airtable workspace updates' },
          { name: 'compliance', description: 'Compliance reviews' },
        ],
      }),
    );

    await classifyCommentSpecializations({
      taskId: 'task-1',
      userId: 'user-1',
      commentId: 'comment-1',
    });

    expect(persistedSpecializationIds).toEqual([
      'spec-legal',
      'spec-airtable',
      'spec-compliance',
    ]);
  });
});
