import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetModelById, mockPersist } = vi.hoisted(() => ({
  mockGetModelById: vi.fn(),
  mockPersist: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskPlanTemplateMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  updateDbById: vi.fn(() => mockPersist),
}));

vi.mock('../../queries/getModelById', () => ({
  getModelById: mockGetModelById,
}));

import { backfillItemSkillId } from './index';

const TEMPLATE_ID = '507f1f77bcf86cd799439011';
const NEW_SKILL_ID = '507f1f77bcf86cd799439012';

describe('backfillItemSkillId task plan template command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetModelById.mockResolvedValue({
      data: {
        id: TEMPLATE_ID,
        items: [
          { agentId: 'agent-1', skillId: null, description: 'Step one', order: 1 },
          { agentId: 'agent-2', skillId: 'skill-old', description: 'Step two', order: 2 },
        ],
      },
    });
    mockPersist.mockResolvedValue({
      data: {
        id: TEMPLATE_ID,
        items: [
          { agentId: 'agent-1', skillId: NEW_SKILL_ID, description: 'Step one', order: 1 },
          { agentId: 'agent-2', skillId: 'skill-old', description: 'Step two', order: 2 },
        ],
      },
    });
  });

  it('should update only the targeted item skillId when backfilling', async () => {
    const result = await backfillItemSkillId({
      id: TEMPLATE_ID,
      templateItemIndex: 0,
      skillId: NEW_SKILL_ID,
    });

    expect(result.data.items?.[0]?.skillId).toBe(NEW_SKILL_ID);
    expect(result.data.items?.[1]?.skillId).toBe('skill-old');
  });
});
