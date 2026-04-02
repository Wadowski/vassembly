import { TableHeaderRow } from './TableHeaderRow';
import type { TableHeadProps } from './types';

export const TableHead = <TRow,>(props: TableHeadProps<TRow>): JSX.Element => {
  const { columns } = props;
  return (
    <thead>
      <TableHeaderRow columns={columns} />
    </thead>
  );
};

TableHead.displayName = 'TableHead';
