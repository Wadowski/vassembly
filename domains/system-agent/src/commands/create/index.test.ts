import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ConflictError, ValidationError } from '@vassembly/errors';
import { AgentCategory } from '../../constants';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockPersist, mockAssertUniqueActiveName } = vi.hoisted(() => ({
  mockPersist: vi.fn(),
  mockAssertUniqueActiveName: vi.fn(),
}));

vi.mock('../../clients', () => ({
  systemAgentMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  createDb: vi.fn(() => mockPersist),
}));

vi.mock('../../queries', () => ({
  assertUniqueActiveName: mockAssertUniqueActiveName,
}));

vi.mock('../../cache/keys', () => ({
  invalidateActiveByNameCache: vi.fn().mockResolvedValue(undefined),
}));

import { create } from './index';

const BASE_INPUT = {
  name: 'Onboarding Helper',
  rule: 'Guide new users through setup',
  description: 'Helps with first-run tasks',
  category: AgentCategory.Onboarding,
  createdByAdminId: 'admin-1',
  updatedByAdminId: 'admin-1',
};

describe('create system agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertUniqueActiveName.mockResolvedValue(undefined);
  });

  it('should persist create payload with audit fields status active and removedAt null', async () => {
    const createdAt = new Date('2026-01-05T00:00:00.000Z');
    mockPersist.mockResolvedValue({
      data: {
        id: 'system-agent-new',
        ...BASE_INPUT,
        status: 'active',
        removedAt: null,
        createdAt,
        updatedAt: createdAt,
      },
    });

    const result = await create(BASE_INPUT);

    expect(result.data.status).toBe('active');
    expect(result.data.removedAt).toBeNull();
    expect(result.data.createdByAdminId).toBe('admin-1');
    expect(result.data.updatedByAdminId).toBe('admin-1');
    expect(result.data.name).toBe(BASE_INPUT.name);
  });

  it('should reject create when name exceeds maximum length', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        name: 'x'.repeat(101),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when name is empty after trim', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        name: '   ',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when rule exceeds maximum length', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        rule: 'r'.repeat(5001),
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

  it('should reject create when category is outside allowed enum', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        category: 'research' as unknown as AgentCategory,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when active agent name already exists case-insensitively', async () => {
    mockAssertUniqueActiveName.mockRejectedValue(new ConflictError('System agent name already in use'));

    await expect(
      create({
        ...BASE_INPUT,
        name: 'onboarding helper',
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should accept create when name and rule are at maximum allowed length', async () => {
    const maxName = 'n'.repeat(100);
    const maxRule = 'r'.repeat(5000);
    mockPersist.mockResolvedValue({
      data: {
        id: 'system-agent-boundary',
        ...BASE_INPUT,
        name: maxName,
        rule: maxRule,
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        updatedAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    });

    const result = await create({
      ...BASE_INPUT,
      name: maxName,
      rule: maxRule,
    });

    expect(result.data.name).toHaveLength(100);
    expect(result.data.rule).toHaveLength(5000);
  });

  it('should accept create when name contains special characters', async () => {
    const name = 'Helper (v2) — "Beta"';
    mockPersist.mockResolvedValue({
      data: {
        id: 'system-agent-special',
        ...BASE_INPUT,
        name,
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        updatedAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    });

    const result = await create({
      ...BASE_INPUT,
      name,
    });

    expect(result.data.name).toBe(name);
  });

  it('should reject create when required audit fields are missing', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        createdByAdminId: '',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should default assignedToolIds to empty array when omitted', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'system-agent-new',
        ...BASE_INPUT,
        assignedToolIds: [],
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        updatedAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    });

    const result = await create(BASE_INPUT);

    expect(result.data.assignedToolIds).toEqual([]);
  });

  it('should persist assignedToolIds when valid registry ids are provided', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: 'system-agent-tools',
        ...BASE_INPUT,
        assignedToolIds: ['use-agent', 'list-agents'],
        status: 'active',
        removedAt: null,
        createdAt: new Date('2026-01-05T00:00:00.000Z'),
        updatedAt: new Date('2026-01-05T00:00:00.000Z'),
      },
    });

    const result = await create({
      ...BASE_INPUT,
      assignedToolIds: ['use-agent', 'list-agents'],
    });

    expect(result.data.assignedToolIds).toEqual(['use-agent', 'list-agents']);
  });

  it('should reject create when assignedToolIds exceeds maximum count', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        assignedToolIds: ['use-agent', 'list-agents', 'extra-tool'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when assignedToolIds contains duplicates', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        assignedToolIds: ['use-agent', 'use-agent'],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when assignedToolIds contains empty strings', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        assignedToolIds: [''],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject create when assignedToolIds contains unknown registry ids', async () => {
    await expect(
      create({
        ...BASE_INPUT,
        assignedToolIds: ['nonexistent-tool'],
      }),
    ).rejects.toThrow(ValidationError);
  });
});
