import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { McpWithConfigurationStatus } from '@vassembly/ui-api-hooks';

const { mockSetZeroConfigMcpsEnabled, mockRefetch } = vi.hoisted(() => ({
  mockSetZeroConfigMcpsEnabled: vi.fn(),
  mockRefetch: vi.fn(),
}));

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

let mockMcps: McpWithConfigurationStatus[] = [];

vi.mock('@vassembly/ui-api-hooks', () => ({
  useSetZeroConfigMcpsEnabled: () => [
    mockSetZeroConfigMcpsEnabled,
    { loading: false, error: null },
  ],
  useMcps: () => ({
    data: { mcps: mockMcps },
    loading: false,
    error: undefined,
    refetch: mockRefetch,
  }),
}));

import { useMcpConnectionsStep } from './useMcpConnectionsStep';

describe('useMcpConnectionsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMcps = [];
    mockRefetch.mockImplementation(async () => {
      return undefined;
    });
  });

  it('should initialize with isEnabled false', () => {
    const { result } = renderHook(() => useMcpConnectionsStep({ isLocked: false }));

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it('should reflect enabled MCPs from server data', async () => {
    mockMcps = [
      buildMcp({ id: 'mcp-1', enabled: true }),
      buildMcp({ id: 'mcp-2', enabled: true }),
    ];

    const { result } = renderHook(() => useMcpConnectionsStep({ isLocked: false }));

    await waitFor(() => {
      expect(result.current.isEnabled).toBe(true);
    });
  });

  it('should refetch MCPs after a successful toggle', async () => {
    mockSetZeroConfigMcpsEnabled.mockResolvedValue({
      enabled: true,
      mcpIds: ['mcp-1'],
      updatedCount: 1,
    });

    const { result } = renderHook(() => useMcpConnectionsStep({ isLocked: false }));

    await act(async () => {
      await result.current.handleToggle(true);
    });

    expect(mockSetZeroConfigMcpsEnabled).toHaveBeenCalledWith({ enabled: true });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should leave isEnabled unchanged when toggle fails', async () => {
    mockSetZeroConfigMcpsEnabled.mockResolvedValue(undefined);

    const { result } = renderHook(() => useMcpConnectionsStep({ isLocked: false }));

    await act(async () => {
      await result.current.handleToggle(true);
    });

    expect(result.current.isEnabled).toBe(false);
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
