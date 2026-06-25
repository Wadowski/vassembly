'use client';

import { useCallback, useEffect } from 'react';

import { useSkillsBySpecialization } from '@vassembly/ui-api-hooks';
import { Alert } from '@vassembly/ui-alert';
import { Button } from '@vassembly/ui-button';
import { Loader } from '@vassembly/ui-loader';
import { Text } from '@vassembly/ui-text';

import { PanelListFooter } from '../PanelListFooter/PanelListFooter';
import { PanelSearchBar } from '../PanelSearchBar/PanelSearchBar';
import { PANEL_PAGE_SIZE } from '../hooks/constants';
import { usePanelList } from '../hooks/usePanelList';

import { SpecializationSkillListItem } from './SpecializationSkillListItem/SpecializationSkillListItem';
import styles from './SpecializationSkillsPanel.module.scss';
import type { SpecializationSkillsPanelProps } from './types';

const EMPTY_MESSAGE = 'No skills linked to this specialization yet.';
const FILTERED_EMPTY_MESSAGE = 'No skills match your search.';
const ERROR_MESSAGE = 'Unable to load skills for this specialization.';

export const SpecializationSkillsPanel = ({
  specializationId,
}: SpecializationSkillsPanelProps): JSX.Element => {
  const { data, loading, error, execute } = useSkillsBySpecialization();
  const total = data?.total ?? 0;
  const panel = usePanelList({ total, size: PANEL_PAGE_SIZE });
  const items = data?.items ?? [];
  const hasError = error !== undefined && data === undefined;

  const refreshSkills = useCallback(async (): Promise<void> => {
    const trimmedSearch = panel.debouncedSearch.trim();
    await execute({
      specializationId,
      page: panel.page,
      size: PANEL_PAGE_SIZE,
      ...(trimmedSearch.length >= 1 ? { search: trimmedSearch } : {}),
    });
  }, [execute, panel.debouncedSearch, panel.page, specializationId]);

  useEffect(() => {
    void refreshSkills();
  }, [refreshSkills]);

  const showList = !loading && !hasError && items.length > 0;
  const showEmpty = !loading && !hasError && total === 0 && !panel.hasActiveSearch;
  const showFilteredEmpty = !loading && !hasError && total === 0 && panel.hasActiveSearch;

  return (
    <section className={styles.panel} aria-label="Skills">
      <Text variant="h2" as="h2">
        Skills
      </Text>
      <PanelSearchBar
        value={panel.searchInput}
        placeholder="Search skills"
        ariaLabel="Search skills"
        isDisabled={loading}
        onChange={panel.handleSearchChange}
        onClear={panel.handleClearSearch}
      />
      {loading ? <Loader ariaLabel="Loading skills" /> : null}
      {hasError ? (
        <div className={styles.errorBlock}>
          <Alert variant="error" message={ERROR_MESSAGE} />
          <Button
            variant="outlined"
            text="Try again"
            onClick={() => {
              void refreshSkills();
            }}
          />
        </div>
      ) : null}
      {showList ? (
        <div className={styles.list}>
          {items.map((skill) => (
            <SpecializationSkillListItem
              key={skill.id}
              skill={skill}
              specializationId={specializationId}
            />
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
        ariaLabel="Skills pagination"
        onPageChange={panel.handlePageChange}
      />
    </section>
  );
};
