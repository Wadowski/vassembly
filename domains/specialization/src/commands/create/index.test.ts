import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, ValidationError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetRaw, mockPersist } = vi.hoisted(() => ({
  mockGetRaw: vi.fn(),
  mockPersist: vi.fn(),
}));

vi.mock('../../clients', () => ({
  specializationMongodbDao: {
    getRaw: mockGetRaw,
  },
}));

vi.mock('@vassembly/commands', () => ({
  createDb: vi.fn(() => mockPersist),
}));

import { create } from './index';

const BASE_INPUT = {
  name: 'Email Automation',
  description: 'Tasks involving email workflows and inbox management',
};

const EXISTING_ID = '507f1f77bcf86cd799439011';

describe('create specialization command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRaw.mockResolvedValue(null);
  });

  it('should create specialization with normalized lowercase name when name is new', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439099',
        name: 'email automation',
        description: BASE_INPUT.description,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
        updatedAt: new Date('2026-01-15T10:00:00.000Z'),
      },
    });

    const result = await create(BASE_INPUT);

    expect(result).toEqual({
      id: '507f1f77bcf86cd799439099',
      isNew: true,
    });
    expect(mockPersist).toHaveBeenCalledWith({
      name: 'email automation',
      description: BASE_INPUT.description,
    });
  });

  it('should return existing specialization id with isNew false when name already exists', async () => {
    mockGetRaw.mockResolvedValue({
      id: EXISTING_ID,
      name: 'email automation',
      description: 'Existing description',
    });

    const result = await create(BASE_INPUT);

    expect(result).toEqual({
      id: EXISTING_ID,
      isNew: false,
    });
    expect(mockPersist).not.toHaveBeenCalled();
  });

  it('should treat duplicate names case-insensitively when checking existing records', async () => {
    mockGetRaw.mockResolvedValue({
      id: EXISTING_ID,
      name: 'email automation',
      description: 'Existing description',
    });

    const result = await create({
      ...BASE_INPUT,
      name: 'EMAIL AUTOMATION',
    });

    expect(result).toEqual({
      id: EXISTING_ID,
      isNew: false,
    });
    expect(mockGetRaw).toHaveBeenCalledWith({ name: 'email automation' });
  });

  it('should return existing specialization when duplicate key race occurs on insert', async () => {
    mockPersist.mockRejectedValue({ code: 11000 });
    mockGetRaw
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: EXISTING_ID,
        name: 'email automation',
        description: 'Existing description',
      });

    const result = await create(BASE_INPUT);

    expect(result).toEqual({
      id: EXISTING_ID,
      isNew: false,
    });
  });

  it('should throw ConflictError when duplicate key occurs and existing record cannot be loaded', async () => {
    mockPersist.mockRejectedValue({ code: 11000 });
    mockGetRaw.mockResolvedValue(null);

    await expect(create(BASE_INPUT)).rejects.toThrow(ConflictError);
  });

  it('should reject create when name is empty after trim', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        name: '   ',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when description exceeds maximum length', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        description: 'd'.repeat(501),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when name exceeds maximum length', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        name: 'n'.repeat(101),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
