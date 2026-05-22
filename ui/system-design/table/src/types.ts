import type { ReactNode } from 'react';

export type ColumnDef<TRow> = {
  key: string;
  header: string;
  render?: (args: { row: TRow }) => ReactNode;
};

export type TableProps<TRow> = {
  columns: ColumnDef<TRow>[];
  data: TRow[];
  pageSize?: number;
  className?: string;
  caption?: string;
  emptyState?: ReactNode;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

export type UseTableArgs<TRow> = {
  data: TRow[];
  pageSize: number;
  isControlled?: boolean;
  currentPage?: number;
  totalPages?: number;
};

export type UseTableResult<TRow> = {
  currentPage: number;
  totalPages: number;
  paginatedRows: TRow[];
  onPageChange: (page: number) => void;
};

export type TableCaptionProps = {
  caption: string;
};

export type TableHeadProps<TRow> = {
  columns: ColumnDef<TRow>[];
};

export type TableHeaderRowProps<TRow> = {
  columns: ColumnDef<TRow>[];
};

export type TableBodyProps<TRow> = {
  columns: ColumnDef<TRow>[];
  rows: TRow[];
};

export type TableBodyRowProps<TRow> = {
  columns: ColumnDef<TRow>[];
  row: TRow;
  rowIndex: number;
};

export type TableBodyCellProps<TRow> = {
  column: ColumnDef<TRow>;
  row: TRow;
};

export type TableEmptyStateProps<TRow> = {
  columns: ColumnDef<TRow>[];
  emptyState?: ReactNode;
};
