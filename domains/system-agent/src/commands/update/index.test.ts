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

const { mockUpdateDb, mockAssertUniqueActiveName, mockGetModelById } = vi.hoisted(() => ({
  mockUpdateDb: vi.fn(),
  mockAssertUniqueActiveName: vi.fn(),
  mockGetModelById: vi.fn(),
}));

vi.mock('../../clients', () => ({
  systemAgentMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  updateDbById: vi.fn(() => mockUpdateDb),
}));

vi.mock('../../queries', () => ({
  assertUniqueActiveName: mockAssertUniqueActiveName,
  getModelById: mockGetModelById,
}));

vi.mock('../../cache/keys', () => ({
  invalidateActiveByNameCache: vi.fn().mockResolvedValue(undefined),
}));

import { update } from './index';

const AGENT_ID = '507f1f77bcf86cd799439011';

describe('update system agent command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertUniqueActiveName.mockResolvedValue(undefined);
    mockGetModelById.mockResolvedValue({
      data: { id: AGENT_ID, name: 'Onboarding Helper' },
    });
  });

  it('should apply partial field changes and refresh updatedByAdminId audit field', async () => {
    const updatedAt = new Date('2026-03-01T00:00:00.000Z');
    mockUpdateDb.mockResolvedValue({
      data: {
        id: AGENT_ID,
        name: 'Renamed Helper',
        category: 'compliance',
        description: 'Updated description',
        rule: 'Updated rule',
        status: 'active',
        createdByAdminId: 'admin-1',
        updatedByAdminId: 'admin-2',
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt,
      },
    });

    const result = await update({
      id: AGENT_ID,
      updatedByAdminId: 'admin-2',
      data: { name: 'Renamed Helper', category: AgentCategory.Compliance },
    });

    expect(result.data.id).toBe(AGENT_ID);
    expect(result.data.name).toBe('Renamed Helper');
    expect(result.data.updatedByAdminId).toBe('admin-2');
    expect(result.data.updatedAt).toEqual(updatedAt);
  });

  it('should reject update payloads whose strings violate maximum lengths', async () => {
    await expect(
      update({
        id: AGENT_ID,
        updatedByAdminId: 'admin-1',
        data: { name: 'x'.repeat(101) },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject update payloads with invalid category enum', async () => {
    await expect(
      update({
        id: AGENT_ID,
        updatedByAdminId: 'admin-1',
        data: { category: 'invalid' as unknown as AgentCategory },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject attempts to mutate immutable identifiers via patch payloads', async () => {
    await expect(
      update({
        id: AGENT_ID,
        updatedByAdminId: 'admin-1',
        data: { createdByAdminId: 'admin-2' } as never,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject rename when another active agent already uses the name', async () => {
    mockAssertUniqueActiveName.mockRejectedValue(new ConflictError('System agent name already in use'));

    await expect(
      update({
        id: AGENT_ID,
        updatedByAdminId: 'admin-1',
        data: { name: 'Existing Agent' },
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should allow rename when name is unchanged for the same agent', async () => {
    mockUpdateDb.mockResolvedValue({
      data: {
        id: AGENT_ID,
        name: 'Stable Name',
        category: 'utility',
        description: 'Desc',
        rule: 'Rule',
        status: 'active',
        createdByAdminId: 'admin-1',
        updatedByAdminId: 'admin-1',
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    const result = await update({
      id: AGENT_ID,
      updatedByAdminId: 'admin-1',
      data: { name: 'Stable Name', description: 'Desc' },
    });

    expect(result.data.name).toBe('Stable Name');
  });

  it('should reject update when updatedByAdminId is missing', async () => {
    await expect(
      update({
        id: AGENT_ID,
        updatedByAdminId: '',
        data: { description: 'New text' },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should accept assignedToolIds replacement on update', async () => {
    mockUpdateDb.mockResolvedValue({
      data: {
        id: AGENT_ID,
        name: 'Onboarding Helper',
        assignedToolIds: ['agent-use', 'agent-list'],
        category: 'onboarding',
        description: 'Desc',
        rule: 'Rule',
        status: 'active',
        createdByAdminId: 'admin-1',
        updatedByAdminId: 'admin-2',
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    const result = await update({
      id: AGENT_ID,
      updatedByAdminId: 'admin-2',
      data: { assignedToolIds: ['agent-use', 'agent-list'] },
    });

    expect(result.data.assignedToolIds).toEqual(['agent-use', 'agent-list']);
  });

  it('should accept clearing assignedToolIds to empty array on update', async () => {
    mockUpdateDb.mockResolvedValue({
      data: {
        id: AGENT_ID,
        name: 'Onboarding Helper',
        assignedToolIds: [],
        category: 'onboarding',
        description: 'Desc',
        rule: 'Rule',
        status: 'active',
        createdByAdminId: 'admin-1',
        updatedByAdminId: 'admin-2',
        removedAt: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });

    const result = await update({
      id: AGENT_ID,
      updatedByAdminId: 'admin-2',
      data: { assignedToolIds: [] },
    });

    expect(result.data.assignedToolIds).toEqual([]);
  });

  it('should reject update when assignedToolIds exceeds maximum count', async () => {
    await expect(
      update({
        id: AGENT_ID,
        updatedByAdminId: 'admin-1',
        data: { assignedToolIds: ['agent-use', 'agent-list', 'extra-tool'] },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject update when assignedToolIds contains duplicates', async () => {
    await expect(
      update({
        id: AGENT_ID,
        updatedByAdminId: 'admin-1',
        data: { assignedToolIds: ['agent-list', 'agent-list'] },
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should reject update when assignedToolIds contains unknown registry ids', async () => {
    await expect(
      update({
        id: AGENT_ID,
        updatedByAdminId: 'admin-1',
        data: { assignedToolIds: ['unknown-tool'] },
      }),
    ).rejects.toThrow(ValidationError);
  });
});
