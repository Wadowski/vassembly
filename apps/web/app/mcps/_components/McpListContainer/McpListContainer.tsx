'use client';

import { useMemo } from 'react';

import { Alert } from '@vassembly/ui-alert';
import { Loader } from '@vassembly/ui-loader';
import { Pagination } from '@vassembly/ui-pagination';
import { Text } from '@vassembly/ui-text';

import { McpListEmptyState } from '../McpListEmptyState/McpListEmptyState';
import { McpListItem } from '../McpListItem/McpListItem';
import { McpSearchBar } from '../McpSearchBar/McpSearchBar';
import { McpTagFilter } from '../McpTagFilter/McpTagFilter';

import styles from './McpListContainer.module.scss';
import { useMcpList } from './useMcpList';

export const McpListContainer = (): JSX.Element => {
  const list = useMcpList();

  const emptyState = useMemo(() => {
    if (list.isFilteredEmpty) {
      return <McpListEmptyState variant="no-results" />;
    }
    if (list.isEmpty) {
      return <McpListEmptyState variant="no-mcps" />;
    }
    return null;
  }, [list.isEmpty, list.isFilteredEmpty]);

  const showGrid = !list.loading && list.items.length > 0;
  const showCount = list.total > 0;

  return (
    <div className={styles.container}>
      {list.errorMessage !== undefined ? <Alert variant="error" message={list.errorMessage} /> : null}

      <div className={styles.toolbar}>
        <McpSearchBar
          value={list.searchInput}
          isDisabled={list.loading}
          onChange={list.handleSearchChange}
          onClear={list.handleClearSearch}
        />
        <McpTagFilter
          selectedTags={list.selectedTags}
          isDisabled={list.loading}
          onChange={list.handleTagsChange}
          onReset={list.handleResetTags}
        />
      </div>

      {list.loading ? <Loader ariaLabel="Loading MCPs" /> : null}

      {showGrid ? (
        <div className={styles.grid}>
          {list.items.map((mcp) => (
            <McpListItem key={mcp.id} mcp={mcp} />
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
          ariaLabel="MCP list pagination"
        />
      </div>
    </div>
  );
};
