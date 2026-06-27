import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';
import { InternalToolAccessScope } from '@vassembly/constants';

const constantsMock = vi.hoisted(() => ({
  getInternalToolById: vi.fn(),
  actualGetInternalToolById: undefined as
    | typeof import('@vassembly/constants').getInternalToolById
    | undefined,
}));

vi.mock('@vassembly/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/constants')>();
  constantsMock.actualGetInternalToolById = actual.getInternalToolById;

  return {
    ...actual,
    getInternalToolById: constantsMock.getInternalToolById,
  };
});

import { validateAssignedToolIds } from './validateAssignedToolIds';

describe('validateAssignedToolIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    constantsMock.getInternalToolById.mockImplementation((id: string) =>
      constantsMock.actualGetInternalToolById!(id),
    );
  });

  it('should complete when assignedToolIds are valid registry ids for a personal agent', async () => {
    await expect(
      validateAssignedToolIds({
        assignedToolIds: ['agent-use', 'agent-list'],
        agentType: 'personal',
      }),
    ).resolves.toBeUndefined();
  });

  it('should complete when assignedToolIds are valid registry ids for a system agent', async () => {
    await expect(
      validateAssignedToolIds({
        assignedToolIds: ['agent-use', 'agent-list'],
        agentType: 'system',
      }),
    ).resolves.toBeUndefined();
  });

  it('should complete when assignedToolIds is an empty array', async () => {
    await expect(
      validateAssignedToolIds({
        assignedToolIds: [],
        agentType: 'personal',
      }),
    ).resolves.toBeUndefined();

    await expect(
      validateAssignedToolIds({
        assignedToolIds: [],
        agentType: 'system',
      }),
    ).resolves.toBeUndefined();
  });

  it('should throw WrongParamError when a tool id is unknown', async () => {
    await expect(
      validateAssignedToolIds({
        assignedToolIds: ['unknown-tool'],
        agentType: 'personal',
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should throw WrongParamError when a SYSTEM_ONLY tool is assigned to a personal agent', async () => {
    constantsMock.getInternalToolById.mockReturnValue({
      id: 'system-only-tool',
      displayName: 'System only tool',
      description: 'Available to system agents only',
      accessScope: InternalToolAccessScope.SYSTEM_ONLY,
      llmToolName: 'system_only_tool',
    });

    await expect(
      validateAssignedToolIds({
        assignedToolIds: ['system-only-tool'],
        agentType: 'personal',
      }),
    ).rejects.toThrow(WrongParamError);
  });

  it('should throw WrongParamError when assignedToolIds contains duplicates', async () => {
    await expect(
      validateAssignedToolIds({
        assignedToolIds: ['agent-use', 'agent-use'],
        agentType: 'personal',
      }),
    ).rejects.toThrow(WrongParamError);
  });
});
