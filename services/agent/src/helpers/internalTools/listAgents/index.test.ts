import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AgentCategory, AgentStatus } from '@vassembly/domain-agent';

const { mockGetListForUser, mockGetAdminList } = vi.hoisted(() => ({
  mockGetListForUser: vi.fn(),
  mockGetAdminList: vi.fn(),
}));

vi.mock('@vassembly/domain-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-agent')>();

  return {
    ...actual,
    default: {
      commands: actual.default.commands,
      queries: {
        ...actual.default.queries,
        getListForUser: mockGetListForUser,
      },
    },
  };
});

vi.mock('@vassembly/domain-system-agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vassembly/domain-system-agent')>();

  return {
    ...actual,
    default: {
      commands: actual.default.commands,
      queries: {
        ...actual.default.queries,
        getAdminList: mockGetAdminList,
      },
    },
  };
});

import { listAgents } from './index';

import type { InternalToolContext } from '../types';

const BASE_CONTEXT: InternalToolContext = {
  userId: 'user-1',
  taskId: 'task-1',
  invocationId: 'invocation-1',
  callerAgentId: 'caller-agent-1',
  callerAgentType: 'personal',
  recursionDepth: 0,
  rootInvokeId: 'root-invoke-1',
};

const PERSONAL_AGENT_ROW = {
  id: 'personal-1',
  userId: 'user-1',
  name: 'Invoice Helper',
  description: 'Handles invoices',
  category: AgentCategory.Utility,
  status: AgentStatus.Active,
};

const SYSTEM_AGENT_ROW = {
  id: 'system-1',
  name: 'Compliance Bot',
  description: 'Compliance tasks',
  status: AgentStatus.Active,
};

describe('listAgents internal tool handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetListForUser.mockResolvedValue({
      items: [PERSONAL_AGENT_ROW],
      totalCount: 1,
      page: 0,
      size: 50,
    });
    mockGetAdminList.mockResolvedValue({
      items: [SYSTEM_AGENT_ROW],
      totalCount: 1,
      page: 0,
      size: 50,
    });
  });

  it('should return only active personal agents when caller is personal', async () => {
    const result = await listAgents({
      args: {},
      context: { ...BASE_CONTEXT, callerAgentType: 'personal' },
    });

    const agents = JSON.parse(result) as Array<Record<string, unknown>>;

    expect(agents).toEqual([
      {
        name: 'Invoice Helper',
        description: 'Handles invoices',
        category: AgentCategory.Utility,
        agentType: 'personal',
      },
    ]);
    expect(agents.every((agent) => agent.agentType === 'personal')).toBe(true);
  });

  it('should return active system and personal agents when caller is system', async () => {
    const result = await listAgents({
      args: {},
      context: { ...BASE_CONTEXT, callerAgentType: 'system' },
    });

    const agents = JSON.parse(result) as Array<Record<string, unknown>>;

    expect(agents).toEqual(
      expect.arrayContaining([
        {
          name: 'Compliance Bot',
          description: 'Compliance tasks',
          category: null,
          agentType: 'system',
        },
        {
          name: 'Invoice Helper',
          description: 'Handles invoices',
          category: AgentCategory.Utility,
          agentType: 'personal',
        },
      ]),
    );
    expect(agents.some((agent) => agent.agentType === 'system')).toBe(true);
    expect(agents.some((agent) => agent.agentType === 'personal')).toBe(true);
  });

  it('should list agents for context userId when LLM args include a different userId', async () => {
    mockGetListForUser.mockImplementation(async ({ userId }: { userId: string }) => {
      if (userId === 'trusted-user') {
        return {
          items: [
            {
              ...PERSONAL_AGENT_ROW,
              userId: 'trusted-user',
              name: 'Trusted Agent',
            },
          ],
          totalCount: 1,
          page: 0,
          size: 50,
        };
      }

      return {
        items: [
          {
            ...PERSONAL_AGENT_ROW,
            userId: 'attacker-user',
            name: 'Attacker Agent',
          },
        ],
        totalCount: 1,
        page: 0,
        size: 50,
      };
    });

    const result = await listAgents({
      args: { userId: 'attacker-user' },
      context: { ...BASE_CONTEXT, userId: 'trusted-user', callerAgentType: 'personal' },
    });

    const agents = JSON.parse(result) as Array<{ name: string }>;

    expect(agents.some((agent) => agent.name === 'Attacker Agent')).toBe(false);
    expect(agents.some((agent) => agent.name === 'Trusted Agent')).toBe(true);
  });
});
