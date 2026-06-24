import { vi } from 'vitest';

export const createSpecializationHooksMock = () => ({
  useSpecializations: vi.fn(() => ({
    data: { items: [], total: 0, page: 0, size: 20 },
    loading: false,
    error: undefined,
    execute: vi.fn().mockResolvedValue(undefined),
  })),
  useSpecialization: vi.fn(() => ({
    data: { specialization: null },
    loading: false,
    error: undefined,
    refetch: vi.fn(),
  })),
  useLinkedSpecializations: vi.fn(() => ({
    specializations: [],
    loading: false,
  })),
});
