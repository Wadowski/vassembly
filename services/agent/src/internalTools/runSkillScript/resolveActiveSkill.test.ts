import { describe, expect, it, vi, beforeEach } from 'vitest';

import { NotFoundError } from '@vassembly/errors';

const { mockGetActiveRuleByName, mockResolveSpecializationId } = vi.hoisted(() => ({
  mockGetActiveRuleByName: vi.fn(),
  mockResolveSpecializationId: vi.fn(),
}));

vi.mock('@vassembly/domain-skill', () => ({
  default: {
    queries: {
      getActiveRuleByName: mockGetActiveRuleByName,
    },
  },
}));

vi.mock('./resolveSpecializationId', () => ({
  resolveSpecializationId: mockResolveSpecializationId,
}));

import { resolveActiveSkill } from './resolveActiveSkill';

import type { InternalToolContext } from '../types';

const TOOL_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  invocationId: 'invocation-1',
  callerAgentId: 'worker-agent',
  callerAgentType: 'system',
  recursionDepth: 1,
  rootInvokeId: 'root-1',
  specializationIds: ['spec-a', 'spec-b'],
};

describe('resolveActiveSkill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetActiveRuleByName.mockResolvedValue({
      skillId: 'skill-b',
      specializationId: 'spec-b',
      rule: 'Rule',
      scripts: [{ filename: 'scripts/verify.py', language: 'python', storageKey: 'k1' }],
    });
  });

  it('should prefer caller specializationId over task context specializationIds', async () => {
    mockResolveSpecializationId.mockResolvedValue('spec-b');

    await resolveActiveSkill({
      skillName: 'verify-ip-reachability',
      context: TOOL_CONTEXT,
    });

    expect(mockGetActiveRuleByName).toHaveBeenCalledWith({
      specializationId: 'spec-b',
      skillName: 'verify-ip-reachability',
    });
    expect(mockGetActiveRuleByName).toHaveBeenCalledTimes(1);
  });

  it('should iterate task specializationIds only when caller has no specializationId', async () => {
    mockResolveSpecializationId.mockResolvedValue('');
    mockGetActiveRuleByName
      .mockRejectedValueOnce(new NotFoundError('not found'))
      .mockResolvedValueOnce({
        skillId: 'skill-b',
        specializationId: 'spec-b',
        rule: 'Rule',
        scripts: [],
      });

    await resolveActiveSkill({
      skillName: 'verify-ip-reachability',
      context: TOOL_CONTEXT,
    });

    expect(mockGetActiveRuleByName).toHaveBeenNthCalledWith(1, {
      specializationId: 'spec-a',
      skillName: 'verify-ip-reachability',
    });
    expect(mockGetActiveRuleByName).toHaveBeenNthCalledWith(2, {
      specializationId: 'spec-b',
      skillName: 'verify-ip-reachability',
    });
  });
});
