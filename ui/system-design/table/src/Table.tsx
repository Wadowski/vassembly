import { Pagination } from '@vassembly/ui-pagination';
import { resolveClassName } from '@vassembly/ui-utils';
import { DEFAULT_PAGE_SIZE } from './constants';
import { TableBody } from './TableBody';
import { TableCaption } from './TableCaption';
import { TableEmptyState } from './TableEmptyState';
import { TableHead } from './TableHead';
import styles from './Table.module.scss';
import type { TableProps } from './types';
import { useTable } from './useTable';

export function Table<TRow>({
  columns,
  data,
  pageSize = DEFAULT_PAGE_SIZE,
  className,
  caption,
  emptyState,
  currentPage,
  totalPages: totalPagesProp,
  onPageChange,
}: TableProps<TRow>): JSX.Element {
  const isControlled =
    currentPage !== undefined && totalPagesProp !== undefined;

  const {
    currentPage: resolvedPage,
    totalPages,
    paginatedRows,
    onPageChange: handleInternalPageChange,
  } = useTable({
    data,
    pageSize,
    isControlled,
    currentPage,
    totalPages: totalPagesProp,
  });

  const tableClassName = resolveClassName(styles.table, className);
  const isEmpty = data.length === 0;

  const handlePaginationChange = (newPage: number): void => {
    if (isControlled && onPageChange) {
      onPageChange(newPage);
      return;
    }
    handleInternalPageChange(newPage);
  };

  return (
    <>
      <table className={tableClassName}>
        {caption ? <TableCaption caption={caption} /> : null}
        <TableHead columns={columns} />
        {isEmpty ? (
          <TableEmptyState columns={columns} emptyState={emptyState} />
        ) : (
          <TableBody columns={columns} rows={paginatedRows} />
        )}
      </table>
      <div className={styles.pagination}>
        <Pagination
          currentPage={resolvedPage}
          totalPages={totalPages}
          onPageChange={handlePaginationChange}
        />
      </div>
    </>
  );
}

Table.displayName = 'Table';
