import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

const { mockCreate, mockGetCredentialById } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockGetCredentialById: vi.fn(),
}));

vi.mock('@vassembly/domain-ai-integration', () => ({
  default: {
    queries: {
      getById: mockGetCredentialById,
    },
  },
}));

vi.mock('../../helpers/validateAssignedMcpIds', () => ({
  validateAssignedMcpIds: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@vassembly/domain-agent', async () => {
  const { toAgentResponse } = await import('../../../../../domains/agent/src/model/toAgentResponse.js');
  const { AgentCategory } = await import('../../../../../domains/agent/src/model/model.js');

  return {
    default: {
      commands: {
        create: mockCreate,
      },
      queries: {},
    },
    toAgentResponse,
    AgentCategory,
  };
});

import { createAgent } from './index';
import { AgentCategory } from '@vassembly/domain-agent';

const BODY = {
  name: 'Planner',
  category: AgentCategory.Coding,
  description: 'Plans tasks',
  rule: 'Stay organized',
};

describe('createAgent handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return persisted agent scoped to authenticated userId', async () => {
    const createdAt = new Date('2026-01-05T00:00:00.000Z');
    const updatedAt = new Date('2026-01-05T00:00:00.000Z');
    mockCreate.mockResolvedValue({
      data: {
        id: 'agent-new',
        ...BODY,
        userId: 'user-auth',
        status: 'active',
        removedAt: null,
        createdAt,
        updatedAt,
      },
    });

    const result = await createAgent({ userId: 'user-auth', body: BODY });

    expect(result.agent.userId).toBe('user-auth');
    expect(result.agent.status).toBe('active');
    expect(result.agent.removedAt).toBeNull();
    expect(result.agent.name).toBe(BODY.name);
  });

  it('should ignore spoofed userId inside body payloads when persisting', async () => {
    mockCreate.mockResolvedValue({
      data: {
        id: 'agent-safe',
        name: BODY.name,
        category: BODY.category,
        description: BODY.description,
        rule: BODY.rule,
        userId: 'user-real',
        status: 'active',
        removedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const result = await createAgent({
      userId: 'user-real',
      body: {
        ...BODY,
        userId: 'user-attacker',
      } as typeof BODY & { userId: string },
    });

    expect(result.agent.userId).toBe('user-real');
  });

  it('should surface validation failures from domain create without masking details', async () => {
    mockCreate.mockRejectedValue(new ValidationError('description too long'));

    await expect(createAgent({ userId: 'user-1', body: BODY })).rejects.toThrow(ValidationError);
  });
});
