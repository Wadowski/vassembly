import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ValidationError } from '@vassembly/errors';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockPersist } = vi.hoisted(() => ({
  mockPersist: vi.fn(),
}));

vi.mock('../../clients', () => ({
  agentMongodbDao: {
    create: mockPersist,
  },
}));

vi.mock('@vassembly/commands', () => ({
  createDb: vi.fn(() => mockPersist),
}));

import { create } from './index';
import { AgentCategory } from '../../model';

const BASE_INPUT = {
  userId: 'user-1',
  name: 'Valid Agent',
  category: AgentCategory.Coding,
  description: 'Helps with reviews',
  rule: 'Stay concise',
};

describe('create agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist create payload with caller userId status active and removedAt null', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'agent-new',
        ...BASE_INPUT,
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        updatedAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    });

    const result = await create(BASE_INPUT);

    expect(result.data.userId).toBe('user-1');
    expect(result.data.status).toBe('active');
    expect(result.data.removedAt).toBeNull();
    expect(result.data.name).toBe(BASE_INPUT.name);
  });

  it('should default assignedMcpIds to empty array when omitted', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'agent-new',
        ...BASE_INPUT,
        assignedMcpIds: [],
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        updatedAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    });

    const result = await create(BASE_INPUT);

    expect(result.data.assignedMcpIds).toEqual([]);
  });

  it('should reject create when assignedMcpIds exceeds maximum length', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        assignedMcpIds: ['mcp-1', 'mcp-2', 'mcp-3', 'mcp-4', 'mcp-5', 'mcp-6'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when assignedMcpIds contains duplicates', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        assignedMcpIds: ['mcp-1', 'mcp-1'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when assignedMcpIds contains empty strings', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        assignedMcpIds: [''],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when name exceeds maximum length', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        name: 'x'.repeat(101),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when category is outside allowed enum', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        category: 'research' as AgentCategory,
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

  it('should reject create when rule exceeds maximum length', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        rule: 'r'.repeat(2001),
      }),
    ).rejects.toThrow(ValidationError);
  });
});
