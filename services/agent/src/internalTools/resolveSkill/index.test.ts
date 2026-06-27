import { describe, it, expect, vi, beforeEach } from 'vitest';

import { NotFoundError, ValidationError } from '@vassembly/errors';

const { mockGetActiveById, mockGetActiveRuleByName } = vi.hoisted(() => ({
  mockGetActiveById: vi.fn(),
  mockGetActiveRuleByName: vi.fn(),
}));

vi.mock('@vassembly/domain-system-agent', () => ({
  default: {
    queries: {
      getActiveById: mockGetActiveById,
    },
  },
}));

vi.mock('@vassembly/domain-skill', () => ({
  default: {
    queries: {
      getActiveRuleByName: mockGetActiveRuleByName,
    },
  },
}));

import { resolveSkillToolHandler } from './index';

import type { InternalToolContext } from '../types';

const TOOL_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  invocationId: 'invocation-1',
  callerAgentId: 'agent-1',
  callerAgentType: 'system',
  recursionDepth: 0,
  rootInvokeId: 'root-1',
};

describe('resolveSkillToolHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveById.mockResolvedValue({
      data: {
        id: 'agent-1',
        specializationId: 'spec-1',
      },
    });
    mockGetActiveRuleByName.mockResolvedValue({
      rule: 'Follow the contract checklist.',
    });
  });

  it('should return JSON with skillName and rule for active skill', async () => {
    const result = await resolveSkillToolHandler(
      { skillName: 'contract-review' },
      TOOL_CONTEXT,
    );

    expect(JSON.parse(result)).toEqual({
      skillName: 'contract-review',
      rule: 'Follow the contract checklist.',
    });
    expect(mockGetActiveRuleByName).toHaveBeenCalledWith({
      specializationId: 'spec-1',
      skillName: 'contract-review',
    });
  });

  it('should use explicit specializationId when provided', async () => {
    await resolveSkillToolHandler(
      { skillName: 'contract-review', specializationId: 'spec-override' },
      TOOL_CONTEXT,
    );

    expect(mockGetActiveById).not.toHaveBeenCalled();
    expect(mockGetActiveRuleByName).toHaveBeenCalledWith({
      specializationId: 'spec-override',
      skillName: 'contract-review',
    });
  });

  it('should throw ValidationError when skillName is missing', async () => {
    await expect(resolveSkillToolHandler({}, TOOL_CONTEXT)).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when caller has no specializationId', async () => {
    mockGetActiveById.mockResolvedValue({ data: { id: 'agent-1', specializationId: null } });

    await expect(
      resolveSkillToolHandler({ skillName: 'contract-review' }, TOOL_CONTEXT),
    ).rejects.toThrow(ValidationError);
  });

  it('should use parent agent specializationId when caller has none', async () => {
    mockGetActiveById
      .mockResolvedValueOnce({ data: { id: 'agent-1', specializationId: null } })
      .mockResolvedValueOnce({ data: { id: 'parent-1', specializationId: 'spec-parent' } });

    const result = await resolveSkillToolHandler(
      { skillName: 'contract-review' },
      { ...TOOL_CONTEXT, parentAgentId: 'parent-1' },
    );

    expect(JSON.parse(result)).toEqual({
      skillName: 'contract-review',
      rule: 'Follow the contract checklist.',
    });
    expect(mockGetActiveById).toHaveBeenNthCalledWith(1, { id: 'agent-1' });
    expect(mockGetActiveById).toHaveBeenNthCalledWith(2, { id: 'parent-1' });
    expect(mockGetActiveRuleByName).toHaveBeenCalledWith({
      specializationId: 'spec-parent',
      skillName: 'contract-review',
    });
  });

  it('should use context specializationIds when caller and parent have none', async () => {
    mockGetActiveById.mockResolvedValue({ data: { id: 'agent-1', specializationId: null } });

    const result = await resolveSkillToolHandler(
      { skillName: 'contract-review' },
      { ...TOOL_CONTEXT, specializationIds: ['spec-from-context'] },
    );

    expect(JSON.parse(result)).toEqual({
      skillName: 'contract-review',
      rule: 'Follow the contract checklist.',
    });
    expect(mockGetActiveById).toHaveBeenCalledTimes(1);
    expect(mockGetActiveRuleByName).toHaveBeenCalledWith({
      specializationId: 'spec-from-context',
      skillName: 'contract-review',
    });
  });

  it('should propagate NotFoundError when skill is missing or inactive', async () => {
    mockGetActiveRuleByName.mockRejectedValue(
      new NotFoundError('Skill "contract-review" not found or not active'),
    );

    await expect(
      resolveSkillToolHandler({ skillName: 'contract-review' }, TOOL_CONTEXT),
    ).rejects.toThrow(NotFoundError);
  });
});
