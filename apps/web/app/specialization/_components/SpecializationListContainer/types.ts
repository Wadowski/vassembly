import type { SpecializationListItem } from '@vassembly/ui-api-hooks';

export interface SpecializationListContainerViewModel {
  searchInput: string;
  items: SpecializationListItem[];
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
  handlePageChange: (page: number) => void;
  handleClearSearch: () => void;
  handleRetry: () => void;
}
