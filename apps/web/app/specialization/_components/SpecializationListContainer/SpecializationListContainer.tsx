'use client';

import { useMemo } from 'react';

import { Alert } from '@vassembly/ui-system-design/alert';
import { Button } from '@vassembly/ui-system-design/button';
import { Loader } from '@vassembly/ui-system-design/loader';
import { Pagination } from '@vassembly/ui-system-design/pagination';
import { Text } from '@vassembly/ui-system-design/text';

import { SpecializationListEmptyState } from './SpecializationListEmptyState/SpecializationListEmptyState';
import { SpecializationListItem } from './SpecializationListItem/SpecializationListItem';
import { SpecializationSearchBar } from './SpecializationSearchBar/SpecializationSearchBar';

import styles from './SpecializationListContainer.module.scss';
import { useSpecializationList } from './useSpecializationList';

const LIST_ERROR_MESSAGE = 'Failed to load specializations.';

export const SpecializationListContainer = (): JSX.Element => {
  const list = useSpecializationList();

  const emptyState = useMemo(() => {
    if (list.isFilteredEmpty) {
      return (
        <SpecializationListEmptyState variant="no-results" searchQuery={list.searchInput.trim()} />
      );
    }

    if (list.isEmpty) {
      return <SpecializationListEmptyState variant="no-specializations" />;
    }

    return null;
  }, [list.isEmpty, list.isFilteredEmpty, list.searchInput]);

  const showGrid = !list.loading && list.items.length > 0;
  const showCount = list.total > 0;
  const showError = list.errorMessage !== undefined;

  return (
    <section className={styles.catalogSection} aria-label="Catalog" role="region">
      <Text variant="label" as="h2" className={styles.catalogHeading}>
        CATALOG
      </Text>
      <div className={styles.container}>
        {showError ? (
          <div className={styles.errorBlock}>
            <Alert variant="error" message={LIST_ERROR_MESSAGE} />
            <Button variant="outlined" text="Try again" onClick={list.handleRetry} />
          </div>
        ) : null}

        <SpecializationSearchBar
          value={list.searchInput}
          isDisabled={list.loading}
          onChange={list.handleSearchChange}
          onClear={list.handleClearSearch}
        />

        {list.loading ? <Loader ariaLabel="Loading specializations" /> : null}

        {showGrid ? (
          <div className={styles.grid}>
            {list.items.map((specialization) => (
              <SpecializationListItem key={specialization.id} specialization={specialization} />
            ))}
          </div>
        ) : null}

        {!list.loading ? emptyState : null}

        <div className={styles.footer}>
          {showCount ? (
            <Text variant="body2" className={styles.countText}>
              Showing {list.rangeStart}–{list.rangeEnd} of {list.total} total
            </Text>
          ) : null}
          <Pagination
            currentPage={list.currentPage}
            totalPages={list.totalPages}
            onPageChange={list.handlePageChange}
            ariaLabel="Specialization list pagination"
          />
        </div>
      </div>
    </section>
  );
};
