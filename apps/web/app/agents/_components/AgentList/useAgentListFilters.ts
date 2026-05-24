'use client';

import { useState } from 'react';

import { useDebouncedValue } from '../../../../lib/hooks/useDebouncedValue';

import { AgentStatus } from '@vassembly/ui-api-hooks';

import type { AgentListStatusFilter } from './types';

export interface AgentListFiltersState {
  searchInput: string;
  debouncedSearch: string;
  statusFilter: AgentListStatusFilter;
  page: number;
  handleSearchChange: (value: string) => void;
  handleStatusChange: (value: AgentListStatusFilter) => void;
  handlePageChange: (page: number) => void;
}

export const useAgentListFilters = (): AgentListFiltersState => {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<AgentListStatusFilter>(AgentStatus.Active);
  const [page, setPage] = useState(0);

  const handleSearchChange = (value: string): void => {
    setSearchInput(value);
    setPage(0);
  };

  const handleStatusChange = (value: AgentListStatusFilter): void => {
    setStatusFilter(value);
    setPage(0);
  };

  const handlePageChange = (nextPage: number): void => {
    setPage(Math.max(0, nextPage));
  };

  return {
    searchInput,
    debouncedSearch,
    statusFilter,
    page,
    handleSearchChange,
    handleStatusChange,
    handlePageChange,
  };
};
