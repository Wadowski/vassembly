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
}: TableProps<TRow>): JSX.Element {
  const { currentPage, totalPages, paginatedRows, onPageChange } = useTable({
    data,
    pageSize,
  });

  const tableClassName = resolveClassName(styles.table, className);
  const isEmpty = data.length === 0;

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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
}

Table.displayName = 'Table';
