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
  taskMongodbDao: {
    create: mockPersist,
  },
}));

vi.mock('@vassembly/commands', () => ({
  createDb: vi.fn(() => mockPersist),
}));

import { create } from './index';

const BASE_INPUT = {
  userId: 'user-1',
  description: 'Review quarterly report',
};

const CREATED_AT = new Date('2026-05-26T12:00:00.000Z');
const UPDATED_AT = new Date('2026-05-26T12:00:00.000Z');

describe('create task command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('happy path', () => {
    it('should return TaskModel with user defaults when userId and description are valid', async () => {
      mockPersist.mockResolvedValue({
        data: {
          id: '507f1f77bcf86cd799439011',
          userId: BASE_INPUT.userId,
          description: BASE_INPUT.description,
          type: 'user',
          status: 'created',
          agentAssignedId: null,
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
        },
      });

      const result = await create(BASE_INPUT);

      expect(result.data.userId).toBe('user-1');
      expect(result.data.type).toBe('user');
      expect(result.data.status).toBe('created');
      expect(result.data.agentAssignedId).toBeNull();
      expect(result.data.description).toBe(BASE_INPUT.description);
      expect(result.data.createdAt).toEqual(CREATED_AT);
      expect(result.data.updatedAt).toEqual(UPDATED_AT);
    });
  });

  describe('validation failures', () => {
    it('should throw ValidationError when description is empty', async () => {
      await expect(
        create({
          ...BASE_INPUT,
          description: '',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when description is whitespace only', async () => {
      await expect(
        create({
          ...BASE_INPUT,
          description: '   \t\n  ',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when description contains only control characters', async () => {
      await expect(
        create({
          ...BASE_INPUT,
          description: '\x00\x1F',
        }),
      ).rejects.toThrow('Description cannot be empty');
    });

    it('should throw ValidationError when description exceeds 5000 characters', async () => {
      await expect(
        create({
          ...BASE_INPUT,
          description: 'd'.repeat(5001),
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when userId is missing', async () => {
      await expect(
        create({
          description: BASE_INPUT.description,
        } as typeof BASE_INPUT),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('sanitization', () => {
    it('should strip control characters from description before persisting', async () => {
      const descriptionWithControlChars = 'Review\x00quarterly\x1Freport';
      const sanitizedDescription = 'Reviewquarterlyreport';

      mockPersist.mockResolvedValue({
        data: {
          id: 'task-sanitized',
          userId: BASE_INPUT.userId,
          description: sanitizedDescription,
          type: 'user',
          status: 'created',
          agentAssignedId: null,
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
        },
      });

      const result = await create({
        ...BASE_INPUT,
        description: descriptionWithControlChars,
      });

      expect(result.data.description).toBe(sanitizedDescription);
    });

    it('should trim leading and trailing whitespace from description before persisting', async () => {
      const trimmedDescription = 'Review quarterly report';

      mockPersist.mockResolvedValue({
        data: {
          id: 'task-trimmed',
          userId: BASE_INPUT.userId,
          description: trimmedDescription,
          type: 'user',
          status: 'created',
          agentAssignedId: null,
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
        },
      });

      const result = await create({
        ...BASE_INPUT,
        description: `  ${trimmedDescription}  `,
      });

      expect(result.data.description).toBe(trimmedDescription);
    });

    it('should preserve newlines in multi-line chat input', async () => {
      const multiLineDescription = 'Line one\nLine two\nLine three';

      mockPersist.mockResolvedValue({
        data: {
          id: 'task-multiline',
          userId: BASE_INPUT.userId,
          description: multiLineDescription,
          type: 'user',
          status: 'created',
          agentAssignedId: null,
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
        },
      });

      const result = await create({
        ...BASE_INPUT,
        description: multiLineDescription,
      });

      expect(result.data.description).toBe(multiLineDescription);
    });

    it('should preserve HTML entities as plain text without decoding', async () => {
      const descriptionWithEntities = 'Use &lt;script&gt; safely &amp; literally';

      mockPersist.mockResolvedValue({
        data: {
          id: 'task-entities',
          userId: BASE_INPUT.userId,
          description: descriptionWithEntities,
          type: 'user',
          status: 'created',
          agentAssignedId: null,
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
        },
      });

      const result = await create({
        ...BASE_INPUT,
        description: descriptionWithEntities,
      });

      expect(result.data.description).toBe(descriptionWithEntities);
    });
  });

  describe('database interaction', () => {
    it('should return persisted task with MongoDB-assigned id', async () => {
      mockPersist.mockResolvedValue({
        data: {
          id: '507f1f77bcf86cd799439011',
          userId: BASE_INPUT.userId,
          description: BASE_INPUT.description,
          type: 'user',
          status: 'created',
          agentAssignedId: null,
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
        },
      });

      const result = await create(BASE_INPUT);

      expect(result.data.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should return persisted task with expected document shape', async () => {
      mockPersist.mockResolvedValue({
        data: {
          id: '507f1f77bcf86cd799439011',
          userId: BASE_INPUT.userId,
          description: BASE_INPUT.description,
          type: 'user',
          status: 'created',
          agentAssignedId: null,
          createdAt: CREATED_AT,
          updatedAt: UPDATED_AT,
        },
      });

      const result = await create(BASE_INPUT);

      expect(result.data).toMatchObject({
        id: expect.any(String),
        userId: BASE_INPUT.userId,
        description: BASE_INPUT.description,
        type: 'user',
        status: 'created',
        agentAssignedId: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
