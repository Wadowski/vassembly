import type { McpWithConfigurationStatus } from '@vassembly/ui-api-hooks';

export interface McpListContainerViewModel {
  searchInput: string;
  selectedTags: string[];
  items: McpWithConfigurationStatus[];
  loading: boolean;
  errorMessage?: string;
  currentPage: number;
  totalPages: number;
  total: number;
  rangeStart: number;
  rangeEnd: number;
  isEmpty: boolean;
  isFilteredEmpty: boolean;
  handleSearchChange: (value: string) => void;
  handleTagsChange: (tags: string[]) => void;
  handlePageChange: (page: number) => void;
  handleClearSearch: () => void;
  handleResetTags: () => void;
}
