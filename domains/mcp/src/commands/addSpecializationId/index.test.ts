import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, ValidationError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockUpdateOne, mockTransformToDeepUpdate } = vi.hoisted(() => ({
  mockUpdateOne: vi.fn(),
  mockTransformToDeepUpdate: vi.fn(() => ({ updatedAt: new Date('2026-06-22T12:00:00.000Z') })),
}));

vi.mock('../../clients', () => ({
  mcpMongodbDao: {
    collection: {
      updateOne: mockUpdateOne,
    },
    transformToDeepUpdate: mockTransformToDeepUpdate,
  },
}));

import { addSpecializationId } from './index';

const MCP_ID = '507f1f77bcf86cd799439011';
const MISSING_MCP_ID = '507f1f77bcf86cd799439012';

describe('addSpecializationId mcp command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success when specialization id is appended to MCP', async () => {
    mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });

    const result = await addSpecializationId({
      mcpId: MCP_ID,
      specializationId: 'spec-1',
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        $addToSet: { specializationIds: 'spec-1' },
      }),
    );
  });

  it('should return success when specialization id is already present', async () => {
    mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 0,
    });

    const result = await addSpecializationId({
      mcpId: MCP_ID,
      specializationId: 'spec-1',
    });

    expect(result).toEqual({ success: true });
  });

  it('should use $addToSet operator for idempotent append', async () => {
    mockUpdateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 0,
    });

    await addSpecializationId({
      mcpId: MCP_ID,
      specializationId: 'spec-1',
    });

    const updatePayload = mockUpdateOne.mock.calls[0]?.[1];
    expect(updatePayload).toHaveProperty('$addToSet');
  });

  it('should throw NotFoundError when MCP does not exist', async () => {
    mockUpdateOne.mockResolvedValue({
      matchedCount: 0,
      modifiedCount: 0,
    });

    await expect(
      addSpecializationId({
        mcpId: MISSING_MCP_ID,
        specializationId: 'spec-1',
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError when mcpId is empty', async () => {
    await expect(
      addSpecializationId({
        mcpId: '',
        specializationId: 'spec-1',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when specializationId is empty', async () => {
    await expect(
      addSpecializationId({
        mcpId: MCP_ID,
        specializationId: '',
      }),
    ).rejects.toThrow(ValidationError);
  });
});
