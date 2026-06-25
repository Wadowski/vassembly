import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

import type { SpecializationResponse } from '@vassembly/domain-specialization';

const { mockGetById } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    commands: {},
    queries: {
      getById: mockGetById,
    },
  },
}));

import { getSpecialization } from './index';

const SPECIALIZATION_ID = 'spec-1';

const buildSpecialization = (
  overrides: Partial<SpecializationResponse> = {},
): SpecializationResponse => ({
  id: SPECIALIZATION_ID,
  name: 'Finance',
  description: 'Financial analysis and reporting',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides,
});

describe('getSpecialization handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue({ data: buildSpecialization() });
  });

  it('should return specialization entity', async () => {
    const result = await getSpecialization({ id: SPECIALIZATION_ID });

    expect(result.specialization).toEqual(buildSpecialization());
  });

  it('should query specialization by id', async () => {
    await getSpecialization({ id: SPECIALIZATION_ID });

    expect(mockGetById).toHaveBeenCalledWith({ id: SPECIALIZATION_ID });
  });

  it('should throw NotFoundError when specialization does not exist', async () => {
    mockGetById.mockRejectedValue(new NotFoundError('Specialization not found'));

    await expect(getSpecialization({ id: 'missing-id' })).rejects.toThrow(NotFoundError);
  });
});
