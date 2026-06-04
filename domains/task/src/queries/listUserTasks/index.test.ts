import { describe, it, expect, vi, beforeEach } from 'vitest';

import { WrongParamError } from '@vassembly/errors';

import { TaskStatus, TaskType, type TaskModel } from '../../model';
import { listUserTasks } from './index';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockGetManyRaw, mockCountDocuments } = vi.hoisted(() => ({
  mockGetManyRaw: vi.fn(),
  mockCountDocuments: vi.fn(),
}));

vi.mock('../../clients', () => ({
  taskMongodbDao: {
    getManyRaw: mockGetManyRaw,
    collection: {
      countDocuments: mockCountDocuments,
    },
  },
}));

const buildTaskDoc = (partial: Partial<TaskModel & { id: string; title?: string | null }>): TaskModel =>
  ({
    id: partial.id ?? 'task-1',
    userId: partial.userId ?? 'user-1',
    description: partial.description ?? 'Default task description',
    type: partial.type ?? TaskType.User,
    status: partial.status ?? TaskStatus.Created,
    agentAssignedId: partial.agentAssignedId ?? null,
    title: partial.title ?? null,
    createdAt: partial.createdAt ?? new Date('2026-05-26T12:00:00.000Z'),
    updatedAt: partial.updatedAt ?? new Date('2026-05-26T12:00:00.000Z'),
  }) as TaskModel;

const buildSortedTasks = (count: number): TaskModel[] =>
  Array.from({ length: count }, (_, index) =>
    buildTaskDoc({
      id: `task-${index}`,
      description: `Task number ${index}`,
      createdAt: new Date(Date.UTC(2026, 4, 26, 12, 0, count - index)),
      updatedAt: new Date(Date.UTC(2026, 4, 26, 12, 0, count - index)),
    }),
  );

describe('listUserTasks query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCountDocuments.mockResolvedValue(0);
    mockGetManyRaw.mockResolvedValue([]);
  });

  describe('success flows', () => {
    it('should list 10 recent tasks for a user sorted newest first by createdAt', async () => {
      const tasks = buildSortedTasks(10);
      mockGetManyRaw.mockResolvedValue(tasks);
      mockCountDocuments.mockResolvedValue(10);

      const result = await listUserTasks({ userId: 'user-1', page: 0, size: 10 });

      expect(result.items).toHaveLength(10);
      expect(result.items[0]?.id).toBe('task-0');
      expect(result.items[9]?.id).toBe('task-9');
      expect(
        result.items.every((task, index, items) => {
          if (index === 0) {
            return true;
          }
          const previous = items[index - 1]?.createdAt?.getTime() ?? 0;
          const current = task.createdAt?.getTime() ?? 0;
          return previous >= current;
        }),
      ).toBe(true);
    });

    it('should return page 0 items 0-9 and page 1 items 10-19 when paginating', async () => {
      const allTasks = buildSortedTasks(25);
      mockGetManyRaw.mockImplementation(
        async (_filter: unknown, options: { offset?: number; limit?: number }) => {
          const offset = options.offset ?? 0;
          const limit = options.limit ?? 10;
          return allTasks.slice(offset, offset + limit);
        },
      );
      mockCountDocuments.mockResolvedValue(25);

      const page0 = await listUserTasks({ userId: 'user-1', page: 0, size: 10 });
      const page1 = await listUserTasks({ userId: 'user-1', page: 1, size: 10 });

      expect(page0.items.map((task) => task.id)).toEqual(allTasks.slice(0, 10).map((task) => task.id));
      expect(page1.items.map((task) => task.id)).toEqual(allTasks.slice(10, 20).map((task) => task.id));
      expect(page0.page).toBe(0);
      expect(page1.page).toBe(1);
    });

    it('should return tasks matching description when search is case-insensitive', async () => {
      mockGetManyRaw.mockResolvedValue([
        buildTaskDoc({ id: 'match-desc', description: 'Review Quarterly Report' }),
      ]);
      mockCountDocuments.mockResolvedValue(1);

      const result = await listUserTasks({
        userId: 'user-1',
        page: 0,
        size: 10,
        search: 'quarterly',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.description?.toLowerCase()).toContain('quarterly');
    });

    it('should return tasks matching title when search is case-insensitive', async () => {
      mockGetManyRaw.mockResolvedValue([
        buildTaskDoc({
          id: 'match-summary',
          description: 'Unrelated description',
          title: 'Summarized invoice parsing work',
        }),
      ]);
      mockCountDocuments.mockResolvedValue(1);

      const result = await listUserTasks({
        userId: 'user-1',
        page: 0,
        size: 10,
        search: 'INVOICE',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.title?.toLowerCase()).toContain('invoice');
    });

    it('should return tasks matching description OR title when search is provided', async () => {
      mockGetManyRaw.mockResolvedValue([
        buildTaskDoc({ id: 'desc-match', description: 'Parse invoices daily' }),
        buildTaskDoc({
          id: 'summary-match',
          description: 'General task',
          title: 'Invoice automation summary',
        }),
      ]);
      mockCountDocuments.mockResolvedValue(2);

      const result = await listUserTasks({
        userId: 'user-1',
        page: 0,
        size: 10,
        search: 'invoice',
      });

      expect(result.items).toHaveLength(2);
    });

    it('should return empty items and zero totalCount when search has no matches', async () => {
      mockGetManyRaw.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      const result = await listUserTasks({
        userId: 'user-1',
        page: 0,
        size: 10,
        search: 'missing-term',
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should cap page size to maximum of 50 items per page', async () => {
      mockGetManyRaw.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      const result = await listUserTasks({ userId: 'user-1', page: 0, size: 999 });

      expect(result.size).toBeLessThanOrEqual(50);
    });

    it('should return correct totalCount when multiple pages exist', async () => {
      const allTasks = buildSortedTasks(47);
      mockGetManyRaw.mockImplementation(
        async (_filter: unknown, options: { offset?: number; limit?: number }) => {
          const offset = options.offset ?? 0;
          const limit = options.limit ?? 10;
          return allTasks.slice(offset, offset + limit);
        },
      );
      mockCountDocuments.mockResolvedValue(47);

      const result = await listUserTasks({ userId: 'user-1', page: 0, size: 10 });

      expect(result.items).toHaveLength(10);
      expect(result.totalCount).toBe(47);
      expect(result.totalCount).toBeGreaterThan(result.items.length);
    });
  });

  describe('edge cases and error flows', () => {
    it('should reject when page is negative', async () => {
      await expect(listUserTasks({ userId: 'user-1', page: -1, size: 10 })).rejects.toThrow(
        WrongParamError,
      );
    });

    it('should reject when size is zero', async () => {
      await expect(listUserTasks({ userId: 'user-1', page: 0, size: 0 })).rejects.toThrow(
        WrongParamError,
      );
    });

    it('should reject when size is negative', async () => {
      await expect(listUserTasks({ userId: 'user-1', page: 0, size: -5 })).rejects.toThrow(
        WrongParamError,
      );
    });

    it('should return empty items when user has no tasks', async () => {
      mockGetManyRaw.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      const result = await listUserTasks({ userId: 'user-empty', page: 0, size: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.page).toBe(0);
      expect(result.size).toBe(10);
    });

    it('should treat whitespace-only search as no search filter', async () => {
      mockGetManyRaw.mockResolvedValue([buildTaskDoc({ id: 'task-visible' })]);
      mockCountDocuments.mockResolvedValue(1);

      const result = await listUserTasks({
        userId: 'user-1',
        page: 0,
        size: 10,
        search: '   \t  ',
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
    });

    it('should handle special characters in search safely without throwing', async () => {
      mockGetManyRaw.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      await expect(
        listUserTasks({
          userId: 'user-1',
          page: 0,
          size: 10,
          search: '(invoice).*+?',
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          items: [],
          totalCount: 0,
        }),
      );
    });

    it('should propagate database errors from MongoDB access', async () => {
      mockGetManyRaw.mockRejectedValue(new Error('MongoDB connection failed'));

      await expect(listUserTasks({ userId: 'user-1', page: 0, size: 10 })).rejects.toThrow(
        'MongoDB connection failed',
      );
    });
  });
});
