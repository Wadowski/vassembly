import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const {
  mockGetModelById,
  mockGetModelByName,
  mockGetActiveById,
} = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockGetModelByName: vi.fn(),
  mockGetActiveById: vi.fn(),
}));

vi.mock('@vassembly/domain-specialization', () => ({
  default: {
    queries: {
      getModelById: mockGetModelById,
      getModelByName: mockGetModelByName,
    },
  },
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: {
      getActiveById: mockGetActiveById,
    },
  },
}));

import { resolveSpecializationReference } from './index';

import type { InternalToolContext } from '../types';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

const VALID_OBJECT_ID = '674a1b2c3d4e5f6789012345';

describe('resolveSpecializationReference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveById.mockResolvedValue({ data: null });
  });

  it('should resolve specialization by MongoDB ObjectId', async () => {
    mockGetModelById.mockResolvedValue({
      data: { id: VALID_OBJECT_ID, name: 'legal' },
    });

    const result = await resolveSpecializationReference({
      specializationRef: VALID_OBJECT_ID,
      context: BASE_CONTEXT,
    });

    expect(result).toEqual({ id: VALID_OBJECT_ID, name: 'legal' });
    expect(mockGetModelByName).not.toHaveBeenCalled();
  });

  it('should resolve specialization by name when ObjectId lookup does not apply', async () => {
    mockGetModelByName.mockResolvedValue({
      data: { id: VALID_OBJECT_ID, name: 'legal' },
    });

    const result = await resolveSpecializationReference({
      specializationRef: 'legal',
      context: BASE_CONTEXT,
    });

    expect(result).toEqual({ id: VALID_OBJECT_ID, name: 'legal' });
    expect(mockGetModelById).not.toHaveBeenCalled();
  });

  it('should resolve from task context specializationIds when ref is omitted and only one is linked', async () => {
    mockGetModelById.mockResolvedValue({
      data: { id: VALID_OBJECT_ID, name: 'legal' },
    });

    const result = await resolveSpecializationReference({
      context: {
        ...BASE_CONTEXT,
        specializationIds: [VALID_OBJECT_ID],
      },
    });

    expect(result).toEqual({ id: VALID_OBJECT_ID, name: 'legal' });
  });

  it('should match specialization name against linked task specializations', async () => {
    mockGetModelById.mockResolvedValue({
      data: { id: VALID_OBJECT_ID, name: 'legal' },
    });

    const result = await resolveSpecializationReference({
      specializationRef: 'legal',
      context: {
        ...BASE_CONTEXT,
        specializationIds: [VALID_OBJECT_ID, '674a1b2c3d4e5f6789012346'],
      },
    });

    expect(result).toEqual({ id: VALID_OBJECT_ID, name: 'legal' });
  });

  it('should throw ValidationError when specialization cannot be resolved', async () => {
    mockGetModelByName.mockRejectedValue(new Error('not found'));

    await expect(
      resolveSpecializationReference({
        specializationRef: 'unknown',
        context: BASE_CONTEXT,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should resolve from caller agent specializationId when explicit ref is omitted', async () => {
    mockGetActiveById.mockResolvedValue({
      data: { specializationId: VALID_OBJECT_ID },
    });
    mockGetModelById.mockResolvedValue({
      data: { id: VALID_OBJECT_ID, name: 'network' },
    });

    const result = await resolveSpecializationReference({
      context: BASE_CONTEXT,
    });

    expect(result).toEqual({ id: VALID_OBJECT_ID, name: 'network' });
  });

  it('should prefer caller specialization when preferCallerSpecialization is true', async () => {
    mockGetActiveById.mockResolvedValue({
      data: { specializationId: VALID_OBJECT_ID },
    });
    mockGetModelById.mockImplementation(async ({ id }: { id: string }) => {
      if (id === VALID_OBJECT_ID) {
        return { data: { id: VALID_OBJECT_ID, name: 'network' } };
      }

      return { data: { id: '674a1b2c3d4e5f6789012346', name: 'wrong' } };
    });

    const result = await resolveSpecializationReference({
      specializationRef: '674a1b2c3d4e5f6789012346',
      context: BASE_CONTEXT,
      preferCallerSpecialization: true,
    });

    expect(result).toEqual({ id: VALID_OBJECT_ID, name: 'network' });
    expect(mockGetModelByName).not.toHaveBeenCalled();
  });

  it('should fall through to agent context when explicit ObjectId lookup returns incomplete data', async () => {
    mockGetModelById.mockImplementation(async ({ id }: { id: string }) => {
      if (id === '674a1b2c3d4e5f6789012346') {
        return { data: { id: '674a1b2c3d4e5f6789012346' } };
      }

      return { data: { id: VALID_OBJECT_ID, name: 'network' } };
    });
    mockGetActiveById.mockResolvedValue({
      data: { specializationId: VALID_OBJECT_ID },
    });

    const result = await resolveSpecializationReference({
      specializationRef: '674a1b2c3d4e5f6789012346',
      context: BASE_CONTEXT,
    });

    expect(result).toEqual({ id: VALID_OBJECT_ID, name: 'network' });
  });
});
