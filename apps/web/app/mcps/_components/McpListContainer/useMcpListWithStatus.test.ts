import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { McpWithConfigurationStatus } from '@vassembly/ui-api-hooks';

import type { McpListContainerViewModel } from './types';
import { useMcpListWithStatus } from './useMcpListWithStatus';

const createMcp = ({
  id,
  requiresConfiguration,
  configurationStatus = 'pending',
}: {
  id: string;
  requiresConfiguration: boolean;
  configurationStatus?: 'configured' | 'pending';
}): McpWithConfigurationStatus => ({
  id,
  name: `MCP ${id}`,
  description: 'Description',
  tags: [],
  iconPath: '/icon.svg',
  slug: id,
  configurationStatus,
  enabled: false,
  requiresConfiguration,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
});

const createListViewModel = (items: McpWithConfigurationStatus[]): McpListContainerViewModel => ({
  searchInput: '',
  selectedTags: [],
  items,
  loading: false,
  currentPage: 2,
  totalPages: 3,
  total: items.length,
  rangeStart: 21,
  rangeEnd: 40,
  isEmpty: false,
  isFilteredEmpty: false,
  handleSearchChange: vi.fn(),
  handleTagsChange: vi.fn(),
  handlePageChange: vi.fn(),
  handleClearSearch: vi.fn(),
  handleResetTags: vi.fn(),
});

vi.mock('./useMcpList', () => ({
  useMcpList: vi.fn(),
}));

import { useMcpList } from './useMcpList';

describe('useMcpListWithStatus', () => {
  it('preserves requiresConfiguration for paginated MCP items', () => {
    const paginatedItems = [
      createMcp({ id: 'mcp-page-2-a', requiresConfiguration: true }),
      createMcp({ id: 'mcp-page-2-b', requiresConfiguration: false }),
    ];

    vi.mocked(useMcpList).mockReturnValue(createListViewModel(paginatedItems));

    const { result } = renderHook(() => useMcpListWithStatus());

    expect(result.current.itemsWithStatus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'mcp-page-2-a',
          requiresConfiguration: true,
        }),
        expect.objectContaining({
          id: 'mcp-page-2-b',
          requiresConfiguration: false,
        }),
      ]),
    );
  });

  it('sorts configured MCPs before pending MCPs', () => {
    const paginatedItems = [
      createMcp({
        id: 'mcp-pending',
        requiresConfiguration: true,
        configurationStatus: 'pending',
      }),
      createMcp({
        id: 'mcp-configured',
        requiresConfiguration: true,
        configurationStatus: 'configured',
      }),
    ];

    vi.mocked(useMcpList).mockReturnValue(createListViewModel(paginatedItems));

    const { result } = renderHook(() => useMcpListWithStatus());

    expect(result.current.itemsWithStatus.map((item) => item.id)).toEqual([
      'mcp-configured',
      'mcp-pending',
    ]);
  });
});
