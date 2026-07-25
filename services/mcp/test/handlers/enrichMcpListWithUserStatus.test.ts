import { describe, it, expect, beforeEach } from 'vitest';

import { createUserMcpConfiguration } from '../../src/handlers/createUserMcpConfiguration';
import { enrichMcpListWithUserStatus } from '../../src/handlers/enrichMcpListWithUserStatus';
import { resetHandlerTestStores } from '../setupHandlerTests';

import type { ServiceContext } from '../../src/types';

interface McpListEntry {
  id: string;
  name: string;
  slug: string;
}

describe('enrichMcpListWithUserStatus', () => {
  const mockContext: ServiceContext = { userId: 'user-123' };

  beforeEach(() => {
    resetHandlerTestStores();
  });

  describe('enrichment', () => {
    it('should mark configured MCPs with configured status', async () => {
      await createUserMcpConfiguration(
        { mcpId: 'mcp-gmail', fieldValues: { clientId: 'abc', clientSecret: 'secret' } },
        mockContext,
      );

      const mcps: McpListEntry[] = [
        { id: 'mcp-gmail', name: 'Gmail', slug: 'gmail' },
        { id: 'mcp-brave', name: 'Brave', slug: 'brave' },
      ];

      const result = await enrichMcpListWithUserStatus({ mcps }, mockContext);

      const gmail = result.find((mcp) => mcp.id === 'mcp-gmail');
      const brave = result.find((mcp) => mcp.id === 'mcp-brave');

      expect(gmail?.configurationStatus).toBe('configured');
      expect(gmail?.enabled).toBe(true);
      expect(brave?.configurationStatus).toBe('pending');
      expect(brave?.enabled).toBe(false);
    });
  });

  describe('performance', () => {
    it('should enrich all MCPs using batch lookup', async () => {
      for (let index = 0; index < 5; index += 1) {
        await createUserMcpConfiguration(
          { mcpId: `mcp-${index}`, fieldValues: { field: `value-${index}` } },
          mockContext,
        );
      }

      const mcps: McpListEntry[] = Array.from({ length: 10 }, (_, index) => ({
        id: `mcp-${index}`,
        name: `MCP ${index}`,
        slug: `mcp-${index}`,
      }));

      const result = await enrichMcpListWithUserStatus({ mcps }, mockContext);

      expect(result).toHaveLength(10);
      expect(result.filter((mcp) => mcp.configurationStatus === 'configured')).toHaveLength(5);
    });
  });
});
