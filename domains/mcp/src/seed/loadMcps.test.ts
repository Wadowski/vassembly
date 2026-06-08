import { describe, it, expect, vi, beforeEach } from 'vitest';

import { loadMcps, parseMcpSeedJson } from './loadMcps';
import { mcpSeedSchema } from './schema';
import { VALID_SEED_ENTRIES, VALID_SEED_JSON } from './testFixtures';

vi.mock('@vassembly/client-mongodb/src/connection.js', () => ({
  mongoDb: {
    db: {
      collection: vi.fn(),
    },
  },
}));

const { mockCountDocuments, mockCreateMany, mockReadMcpSeedFile } = vi.hoisted(() => ({
  mockCountDocuments: vi.fn(),
  mockCreateMany: vi.fn(),
  mockReadMcpSeedFile: vi.fn(),
}));

vi.mock('../../clients', () => ({
  mcpMongodbDao: {
    collection: {
      countDocuments: mockCountDocuments,
    },
    createMany: mockCreateMany,
  },
}));

vi.mock('./readMcpSeedFile', () => ({
  readMcpSeedFile: mockReadMcpSeedFile,
}));

describe('loadMcps seed loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadMcpSeedFile.mockResolvedValue(VALID_SEED_JSON);
    mockCountDocuments.mockResolvedValue(0);
    mockCreateMany.mockResolvedValue({ insertedCount: VALID_SEED_ENTRIES.length });
  });

  describe('JSON parsing', () => {
    it('should parse valid JSON without error', () => {
      const parsed = parseMcpSeedJson(VALID_SEED_JSON);

      expect(parsed).toEqual(VALID_SEED_ENTRIES);
    });

    it('should throw SyntaxError when JSON is invalid', () => {
      expect(() => parseMcpSeedJson('{ invalid json')).toThrow(SyntaxError);
    });
  });

  describe('Zod validation', () => {
    it('should pass validation for valid MCP seed entries', () => {
      for (const entry of VALID_SEED_ENTRIES) {
        const result = mcpSeedSchema.safeParse(entry);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(entry);
        }
      }
    });

    it('should fail validation when required fields are missing', () => {
      const result = mcpSeedSchema.safeParse({
        name: 'Gmail MCP',
        description: 'Email integration',
        tags: ['email'],
        iconPath: '/mcps/gmail.svg',
      });

      expect(result.success).toBe(false);
    });

    it('should fail validation when field types are invalid', () => {
      const result = mcpSeedSchema.safeParse({
        slug: 'google-workspace-mcp',
        name: 'Gmail MCP',
        description: 'Complete email management',
        tags: 'email',
        iconPath: '/mcps/gmail.svg',
      });

      expect(result.success).toBe(false);
    });

    it('should fail validation when URL fields have invalid formats', () => {
      const result = mcpSeedSchema.safeParse({
        slug: 'google-workspace-mcp',
        name: 'Gmail MCP',
        description: 'Complete email management',
        tags: ['email'],
        iconPath: '/mcps/gmail.svg',
        documentationUrl: 'not-a-url',
        repositoryUrl: 'also-not-a-url',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('idempotent insert-only', () => {
    it('should insert all seed MCPs on first load when collection is empty', async () => {
      const result = await loadMcps();

      expect(result.insertedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
    });

    it('should not insert duplicates on second load when collection is still empty check path', async () => {
      mockCountDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(VALID_SEED_ENTRIES.length);

      await loadMcps();
      const secondResult = await loadMcps();

      expect(secondResult.insertedCount).toBe(0);
      expect(secondResult.skippedCount).toBe(VALID_SEED_ENTRIES.length);
    });

    it('should report zero inserted MCPs when seed runs again on populated collection', async () => {
      mockCountDocuments.mockResolvedValue(VALID_SEED_ENTRIES.length);

      const result = await loadMcps();

      expect(result.insertedCount).toBe(0);
      expect(result.skippedCount).toBe(VALID_SEED_ENTRIES.length);
    });

    it('should skip seeding when collection already contains MCPs', async () => {
      mockCountDocuments.mockResolvedValue(1);

      const result = await loadMcps();

      expect(result.insertedCount).toBe(0);
      expect(result.skippedCount).toBe(VALID_SEED_ENTRIES.length);
    });
  });

  describe('error handling', () => {
    it('should log error and continue when DAO createMany fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockCreateMany.mockRejectedValue(new Error('Database unavailable'));

      await expect(loadMcps()).resolves.toEqual({
        insertedCount: 0,
        skippedCount: 0,
      });
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not throw when seed loader encounters errors', async () => {
      mockReadMcpSeedFile.mockRejectedValue(new Error('Seed file missing'));

      await expect(loadMcps()).resolves.toEqual({
        insertedCount: 0,
        skippedCount: 0,
      });
    });
  });
});
