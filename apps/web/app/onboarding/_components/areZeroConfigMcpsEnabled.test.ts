import { describe, expect, it } from 'vitest';

import type { McpWithConfigurationStatus } from '@vassembly/ui-api-hooks';

import { areZeroConfigMcpsEnabled } from './areZeroConfigMcpsEnabled';

const buildMcp = (
  partial: Partial<McpWithConfigurationStatus> & Pick<McpWithConfigurationStatus, 'id'>,
): McpWithConfigurationStatus => ({
  name: 'MCP',
  description: 'Description',
  tags: [],
  iconPath: '/icon.svg',
  slug: partial.id,
  configurationStatus: 'pending',
  enabled: false,
  requiresConfiguration: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...partial,
});

describe('areZeroConfigMcpsEnabled', () => {
  it('should return false when there are no zero-config MCPs', () => {
    expect(
      areZeroConfigMcpsEnabled({
        mcps: [buildMcp({ id: 'mcp-1', requiresConfiguration: true })],
      }),
    ).toBe(false);
  });

  it('should return false when zero-config MCPs are not all enabled', () => {
    expect(
      areZeroConfigMcpsEnabled({
        mcps: [
          buildMcp({ id: 'mcp-1', enabled: true }),
          buildMcp({ id: 'mcp-2', enabled: false }),
        ],
      }),
    ).toBe(false);
  });

  it('should return true when all zero-config MCPs are enabled', () => {
    expect(
      areZeroConfigMcpsEnabled({
        mcps: [
          buildMcp({ id: 'mcp-1', enabled: true }),
          buildMcp({ id: 'mcp-2', enabled: true }),
          buildMcp({ id: 'mcp-3', requiresConfiguration: true, enabled: false }),
        ],
      }),
    ).toBe(true);
  });
});
