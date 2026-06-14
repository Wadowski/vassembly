import { describe, expect, it } from 'vitest';

import { getApiMongoIndexFunctions, USER_MCP_CONFIG_INDEX_SPECS } from '../../src/bootstrap/mongoIndexes';

describe('Bootstrap: User MCP Config Indexes', () => {
  describe('indexes registered', () => {
    it('should register user MCP config index setup in API bootstrap', () => {
      const indexFunctions = getApiMongoIndexFunctions();

      expect(indexFunctions.some((indexFn) => indexFn.name === 'setupUserMcpConfigIndexes')).toBe(true);
    });

    it('should define unique index on userId and mcpId', () => {
      const uniqueIndex = USER_MCP_CONFIG_INDEX_SPECS.find(
        (spec) => spec.key.userId === 1 && spec.key.mcpId === 1 && spec.options?.unique === true,
      );

      expect(uniqueIndex).toBeDefined();
    });

    it('should define non-unique index on userId', () => {
      const userIndex = USER_MCP_CONFIG_INDEX_SPECS.find(
        (spec) => spec.key.userId === 1 && spec.key.mcpId === undefined && spec.options?.unique !== true,
      );

      expect(userIndex).toBeDefined();
    });
  });
});
