import { TableBodyCell } from './TableBodyCell';
import type { TableBodyRowProps } from './types';

export const TableBodyRow = <TRow,>(
  props: TableBodyRowProps<TRow>,
): JSX.Element => {
  const { columns, row, rowIndex } = props;
  return (
    <tr>
      {columns.map((column) => (
        <TableBodyCell
          key={`${rowIndex}-${column.key}`}
          column={column}
          row={row}
        />
      ))}
    </tr>
  );
};

TableBodyRow.displayName = 'TableBodyRow';
