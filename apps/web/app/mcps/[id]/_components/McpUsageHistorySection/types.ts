import type { McpUsageHistoryItem } from '@vassembly/ui-api-hooks';

export interface McpUsageHistorySectionProps {
  mcpId: string;
}

export interface UseMcpUsageHistorySectionArgs {
  mcpId: string;
}

export interface UseMcpUsageHistorySectionResult {
  items: McpUsageHistoryItem[];
  loading: boolean;
  isEmpty: boolean;
  currentPage: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  handlePageChange: (page: number) => void;
}

export interface McpUsageHistoryTableProps {
  items: McpUsageHistoryItem[];
  currentPage: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  onPageChange: (page: number) => void;
}

export interface McpUsageHistoryTableRowProps {
  item: McpUsageHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
}
