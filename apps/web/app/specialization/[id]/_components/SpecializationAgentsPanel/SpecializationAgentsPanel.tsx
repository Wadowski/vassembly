'use client';

import { useCallback, useEffect } from 'react';

import { useAgentsBySpecialization } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-system-design/alert';
import { Button } from '@vassembly/ui-system-design/button';
import { Loader } from '@vassembly/ui-system-design/loader';
import { Text } from '@vassembly/ui-system-design/text';

import { PanelListFooter } from '../PanelListFooter/PanelListFooter';
import { PanelSearchBar } from '../PanelSearchBar/PanelSearchBar';
import { PANEL_PAGE_SIZE } from '../hooks/constants';
import { usePanelList } from '../hooks/usePanelList';

import { SpecializationAgentItem } from './SpecializationAgentItem/SpecializationAgentItem';
import styles from './SpecializationAgentsPanel.module.scss';
import type { SpecializationAgentsPanelProps } from './types';

const EMPTY_MESSAGE = 'No agents linked yet.';
const FILTERED_EMPTY_MESSAGE = 'No agents match your search.';
const ERROR_MESSAGE = 'Unable to load agents for this specialization.';

export const SpecializationAgentsPanel = ({
  specializationId,
}: SpecializationAgentsPanelProps): JSX.Element => {
  const { data, loading, error, execute } = useAgentsBySpecialization();
  const total = data?.total ?? 0;
  const panel = usePanelList({ total, size: PANEL_PAGE_SIZE });
  const items = data?.items ?? [];
  const hasError = error !== undefined && data === undefined;

  const refreshAgents = useCallback(async (): Promise<void> => {
    const trimmedSearch = panel.debouncedSearch.trim();
    await execute({
      specializationId,
      page: panel.page,
      size: PANEL_PAGE_SIZE,
      ...(trimmedSearch.length >= 1 ? { search: trimmedSearch } : {}),
    });
  }, [execute, panel.debouncedSearch, panel.page, specializationId]);

  useEffect(() => {
    void refreshAgents();
  }, [refreshAgents]);

  const showList = !loading && !hasError && items.length > 0;
  const showEmpty = !loading && !hasError && total === 0 && !panel.hasActiveSearch;
  const showFilteredEmpty = !loading && !hasError && total === 0 && panel.hasActiveSearch;

  return (
    <section className={styles.panel} aria-label="Linked Agents">
      <Text variant="h2" as="h2">
        Agents
      </Text>
      <PanelSearchBar
        value={panel.searchInput}
        placeholder="Search agents"
        ariaLabel="Search agents"
        isDisabled={loading}
        onChange={panel.handleSearchChange}
        onClear={panel.handleClearSearch}
      />
      {loading ? <Loader ariaLabel="Loading agents" /> : null}
      {hasError ? (
        <div className={styles.errorBlock}>
          <Alert variant="error" message={ERROR_MESSAGE} />
          <Button
            variant="outlined"
            text="Try again"
            onClick={() => {
              void refreshAgents();
            }}
          />
        </div>
      ) : null}
      {showList ? (
        <ul className={styles.list}>
          {items.map((agent) => (
            <li key={agent.id}>
              <SpecializationAgentItem agent={agent} />
            </li>
          ))}
        </ul>
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
        ariaLabel="Agents pagination"
        onPageChange={panel.handlePageChange}
      />
    </section>
  );
};
