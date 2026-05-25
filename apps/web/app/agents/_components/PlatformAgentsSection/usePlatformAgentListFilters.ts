'use client';

import { useState } from 'react';

import { useDebouncedValue } from '../../../../lib/hooks/useDebouncedValue';
import {
  SYSTEM_AGENT_LIST_ALL_STATUSES,
  SystemAgentCategory,
  SystemAgentStatus,
} from '@vassembly/ui-api-hooks';

export type PlatformAgentStatusFilter = SystemAgentStatus | typeof SYSTEM_AGENT_LIST_ALL_STATUSES;
export type PlatformAgentCategoryFilter = SystemAgentCategory | typeof SYSTEM_AGENT_LIST_ALL_STATUSES;

export interface PlatformAgentListFiltersState {
  searchInput: string;
  debouncedSearch: string;
  statusFilter: PlatformAgentStatusFilter;
  categoryFilter: PlatformAgentCategoryFilter;
  handleSearchChange: (value: string) => void;
  handleStatusChange: (value: PlatformAgentStatusFilter) => void;
  handleCategoryChange: (value: PlatformAgentCategoryFilter) => void;
  clearSearch: () => void;
}

export const usePlatformAgentListFilters = (): PlatformAgentListFiltersState => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<PlatformAgentStatusFilter>(SystemAgentStatus.Active);
  const [categoryFilter, setCategoryFilter] = useState<PlatformAgentCategoryFilter>(
    SYSTEM_AGENT_LIST_ALL_STATUSES,
  );

  const handleSearchChange = (value: string): void => {
    setSearchInput(value);
  };

  const handleStatusChange = (value: PlatformAgentStatusFilter): void => {
    setStatusFilter(value);
  };

  const handleCategoryChange = (value: PlatformAgentCategoryFilter): void => {
    setCategoryFilter(value);
  };

  const clearSearch = (): void => {
    setSearchInput('');
  };

  return {
    searchInput,
    debouncedSearch,
    statusFilter,
    categoryFilter,
    handleSearchChange,
    handleStatusChange,
    handleCategoryChange,
    clearSearch,
  };
};
