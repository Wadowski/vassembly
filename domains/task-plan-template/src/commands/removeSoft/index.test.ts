import { describe, it, expect, vi, beforeEach } from 'vitest';

import { InternalError, NotFoundError, WrongParamError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockRemoveSoft, mockGetModelById } = vi.hoisted(() => ({
  mockRemoveSoft: vi.fn(),
  mockGetModelById: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskPlanTemplateMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  removeSoftDb: vi.fn(() => mockRemoveSoft),
}));

vi.mock('../../queries/getModelById', () => ({
  getModelById: mockGetModelById,
}));

vi.mock('../../model', () => ({
  TaskPlanTemplateModel: class TaskPlanTemplateModel {},
  taskPlanTemplateFactory: {
    create: vi.fn((row: Record<string, unknown>) => row),
  },
}));

import { removeSoft } from './index';

const TEMPLATE_ID = '507f1f77bcf86cd799439011';

const buildActiveTemplate = () => ({
  id: TEMPLATE_ID,
  shortName: 'contract-review',
  description: 'Review contracts',
  items: [],
  removedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('removeSoft task plan template command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set removedAt timestamp when archiving active template', async () => {
    const removedAt = new Date('2026-04-01T11:30:00.000Z');
    mockGetModelById.mockResolvedValue({ data: buildActiveTemplate() });
    mockRemoveSoft.mockResolvedValue({
      data: {
        ...buildActiveTemplate(),
        removedAt,
        updatedAt: removedAt,
      },
    });

    const result = await removeSoft({ id: TEMPLATE_ID });

    expect(result.data.removedAt).toEqual(removedAt);
  });

  it('should throw NotFoundError when template not found', async () => {
    mockGetModelById.mockRejectedValue(new NotFoundError('Task plan template not found'));

    await expect(removeSoft({ id: 'missing-id' })).rejects.toThrow(NotFoundError);
  });

  it('should reject archive when template is already archived', async () => {
    mockGetModelById.mockResolvedValue({
      data: {
        ...buildActiveTemplate(),
        removedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    await expect(removeSoft({ id: TEMPLATE_ID })).rejects.toThrow(WrongParamError);
  });

  it('should reject removal when persistence fails unexpectedly', async () => {
    mockGetModelById.mockResolvedValue({ data: buildActiveTemplate() });
    mockRemoveSoft.mockRejectedValue(new InternalError('Database unavailable'));

    await expect(removeSoft({ id: TEMPLATE_ID })).rejects.toThrow(InternalError);
  });
});
