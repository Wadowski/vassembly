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
  taskPlanTemplateMongodbDao: {},
}));

vi.mock('@vassembly/commands', () => ({
  createDb: vi.fn(() => mockPersist),
}));

import { create } from './index';

const VALID_AGENT_ID = '507f1f77bcf86cd799439011';
const VALID_SKILL_ID = '507f1f77bcf86cd799439012';

const buildValidInput = () => ({
  shortName: 'contract-risk-review',
  description: 'Review contract documents for risky clauses.',
  inputDetails: { documentReference: { type: 'file' } },
  outputDetails: { summary: { type: 'text' } },
  items: [
    {
      agentId: VALID_AGENT_ID,
      skillId: VALID_SKILL_ID,
      description: 'Extract clauses from the contract',
      order: 1,
    },
  ],
});

describe('create task plan template command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist template with items when input is valid', async () => {
    mockPersist.mockResolvedValue({
      data: {
        id: '507f1f77bcf86cd799439099',
        ...buildValidInput(),
        normalizedDescriptionHash: 'expected-hash',
      },
    });

    const result = await create(buildValidInput());

    expect(result.data?.shortName).toBe('contract-risk-review');
    expect(result.data?.items).toHaveLength(1);
    expect(result.data?.normalizedDescriptionHash).toBeDefined();
  });

  it('should throw ValidationError when description exceeds 500 characters', async () => {
    await expect(
      create({
        ...buildValidInput(),
        description: 'x'.repeat(501),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when items array is empty', async () => {
    await expect(
      create({
        ...buildValidInput(),
        items: [],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when item description exceeds 500 characters', async () => {
    await expect(
      create({
        ...buildValidInput(),
        items: [
          {
            agentId: VALID_AGENT_ID,
            skillId: null,
            description: 'x'.repeat(501),
            order: 0,
          },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when item order is negative', async () => {
    await expect(
      create({
        ...buildValidInput(),
        items: [
          {
            agentId: VALID_AGENT_ID,
            skillId: null,
            description: 'Run analysis',
            order: -1,
          },
        ],
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw ValidationError when serialized inputDetails exceeds size cap', async () => {
    const oversizedPayload = { blob: 'x'.repeat(33 * 1024) };

    await expect(
      create({
        ...buildValidInput(),
        inputDetails: oversizedPayload,
      }),
    ).rejects.toThrow(ValidationError);
  });
});
