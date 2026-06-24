import { describe, it, expect, vi, beforeEach } from 'vitest';

import { loadSystemAgents, parseSystemAgentSeedJson } from './loadSystemAgents';
import { systemAgentSeedSchema } from './schema';
import { VALID_SEED_ENTRIES, VALID_SEED_JSON } from './testFixtures';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockFindToArray, mockCreateMany, mockReadSystemAgentSeedFile, mockUpdateOne } = vi.hoisted(() => ({
  mockFindToArray: vi.fn(),
  mockCreateMany: vi.fn(),
  mockReadSystemAgentSeedFile: vi.fn(),
  mockUpdateOne: vi.fn(),
}));

vi.mock('../clients', () => ({
  systemAgentMongodbDao: {
    collection: {
      find: vi.fn(() => ({
        project: vi.fn(() => ({
          toArray: mockFindToArray,
        })),
      })),
      updateOne: mockUpdateOne,
    },
    createMany: mockCreateMany,
  },
}));

vi.mock('../cache/keys', () => ({
  invalidateActiveByNameCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./readSystemAgentSeedFile', () => ({
  readSystemAgentSeedFile: mockReadSystemAgentSeedFile,
}));

describe('loadSystemAgents seed loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadSystemAgentSeedFile.mockResolvedValue(VALID_SEED_JSON);
    mockFindToArray.mockResolvedValue([]);
    mockCreateMany.mockResolvedValue({ insertedCount: VALID_SEED_ENTRIES.length });
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
  });

  describe('JSON parsing', () => {
    it('should parse valid JSON without error', () => {
      const parsed = parseSystemAgentSeedJson(VALID_SEED_JSON);

      expect(parsed).toEqual(VALID_SEED_ENTRIES);
    });

    it('should throw SyntaxError when JSON is invalid', () => {
      expect(() => parseSystemAgentSeedJson('{ invalid json')).toThrow(SyntaxError);
    });
  });

  describe('Zod validation', () => {
    it('should pass validation for valid system agent seed entries', () => {
      for (const entry of VALID_SEED_ENTRIES) {
        const result = systemAgentSeedSchema.safeParse(entry);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(entry);
        }
      }
    });

    it('should fail validation when assignedToolIds contain unknown registry ids', () => {
      const result = systemAgentSeedSchema.safeParse({
        name: 'Assistant',
        rule: 'Rule text',
        assignedToolIds: ['unknown-tool'],
      });

      expect(result.success).toBe(false);
    });
  });

  describe('idempotent insert-only', () => {
    it('should insert all seed agents on first load when collection is empty', async () => {
      const result = await loadSystemAgents();

      expect(result.insertedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
      expect(result.updatedCount).toBe(0);
    });

    it('should sync existing seed agents when seed definition changes', async () => {
      mockFindToArray.mockResolvedValue([
        {
          _id: 'assistant-id',
          name: 'Assistant',
          rule: 'Old rule',
          description: 'Main assistant',
          category: 'utility',
          assignedToolIds: ['use-agent', 'list-agents'],
        },
      ]);

      const result = await loadSystemAgents();

      expect(result.insertedCount).toBe(0);
      expect(result.updatedCount).toBe(1);
      expect(mockUpdateOne).toHaveBeenCalledTimes(1);
    });

    it('should skip existing agents on second load when seed is unchanged', async () => {
      mockFindToArray
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(
          VALID_SEED_ENTRIES.map((entry) => ({
            _id: `${entry.name}-id`,
            name: entry.name,
            rule: entry.rule,
            description: entry.description,
            category: entry.category,
            assignedToolIds: entry.assignedToolIds,
          })),
        );

      await loadSystemAgents();
      const secondResult = await loadSystemAgents();

      expect(secondResult.insertedCount).toBe(0);
      expect(secondResult.updatedCount).toBe(0);
      expect(secondResult.skippedCount).toBe(VALID_SEED_ENTRIES.length);
    });
  });

  describe('error handling', () => {
    it('should log error and continue when DAO createMany fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockCreateMany.mockRejectedValue(new Error('Database unavailable'));

      await expect(loadSystemAgents()).resolves.toEqual({
        insertedCount: 0,
        skippedCount: 0,
        updatedCount: 0,
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not throw when seed loader encounters errors', async () => {
      mockReadSystemAgentSeedFile.mockRejectedValue(new Error('Seed file missing'));

      await expect(loadSystemAgents()).resolves.toEqual({
        insertedCount: 0,
        skippedCount: 0,
        updatedCount: 0,
      });
    });
  });
});
