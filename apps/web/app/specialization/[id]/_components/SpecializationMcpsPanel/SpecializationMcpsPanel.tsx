'use client';

import { useCallback, useEffect } from 'react';

import { useMcpCatalog } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-system-design/alert';
import { Button } from '@vassembly/ui-system-design/button';
import { Loader } from '@vassembly/ui-system-design/loader';
import { Text } from '@vassembly/ui-system-design/text';

import { PanelListFooter } from '../PanelListFooter/PanelListFooter';
import { PanelSearchBar } from '../PanelSearchBar/PanelSearchBar';
import { PANEL_PAGE_SIZE } from '../hooks/constants';
import { usePanelList } from '../hooks/usePanelList';

import { SpecializationMcpListItem } from './SpecializationMcpListItem/SpecializationMcpListItem';
import styles from './SpecializationMcpsPanel.module.scss';
import type { SpecializationMcpsPanelProps } from './types';

const EMPTY_MESSAGE = 'No MCPs mapped to this specialization yet.';
const FILTERED_EMPTY_MESSAGE = 'No MCPs match your search.';
const ERROR_MESSAGE = 'Unable to load MCPs for this specialization.';

export const SpecializationMcpsPanel = ({
  specializationId,
}: SpecializationMcpsPanelProps): JSX.Element => {
  const { data, loading, error, execute } = useMcpCatalog();
  const total = data?.total ?? 0;
  const panel = usePanelList({ total, size: PANEL_PAGE_SIZE });
  const items = data?.items ?? [];
  const hasError = error !== undefined && data === undefined;

  const refreshMcps = useCallback(async (): Promise<void> => {
    const trimmedSearch = panel.debouncedSearch.trim();
    await execute({
      specializationId,
      page: panel.page,
      size: PANEL_PAGE_SIZE,
      ...(trimmedSearch.length >= 1 ? { search: trimmedSearch } : {}),
    });
  }, [execute, panel.debouncedSearch, panel.page, specializationId]);

  useEffect(() => {
    void refreshMcps();
  }, [refreshMcps]);

  const showList = !loading && !hasError && items.length > 0;
  const showEmpty = !loading && !hasError && total === 0 && !panel.hasActiveSearch;
  const showFilteredEmpty = !loading && !hasError && total === 0 && panel.hasActiveSearch;

  return (
    <section className={styles.panel} aria-label="Mapped MCPs">
      <Text variant="h2" as="h2">
        Mapped MCPs
      </Text>
      <PanelSearchBar
        value={panel.searchInput}
        placeholder="Search MCPs"
        ariaLabel="Search MCPs"
        isDisabled={loading}
        onChange={panel.handleSearchChange}
        onClear={panel.handleClearSearch}
      />
      {loading ? <Loader ariaLabel="Loading MCPs" /> : null}
      {hasError ? (
        <div className={styles.errorBlock}>
          <Alert variant="error" message={ERROR_MESSAGE} />
          <Button
            variant="outlined"
            text="Try again"
            onClick={() => {
              void refreshMcps();
            }}
          />
        </div>
      ) : null}
      {showList ? (
        <div className={styles.list}>
          {items.map((mcp) => (
            <SpecializationMcpListItem key={mcp.id} mcp={mcp} />
          ))}
        </div>
      ) : null}
      {showEmpty ? (
        <Text variant="body2" className={styles.emptyMessage}>
          {EMPTY_MESSAGE}
        </Text>
      ) : null}
      {showFilteredEmpty ? (
        <Text variant="body2" className={styles.emptyMessage}>
          {FILTERED_EMPTY_MESSAGE}
        </Text>
      ) : null}
      <PanelListFooter
        total={total}
        rangeStart={panel.rangeStart}
        rangeEnd={panel.rangeEnd}
        currentPage={panel.currentPage}
        totalPages={panel.totalPages}
        ariaLabel="MCPs pagination"
        onPageChange={panel.handlePageChange}
      />
    </section>
  );
};
