import { TableBodyRow } from './TableBodyRow';
import type { TableBodyProps } from './types';

export const TableBody = <TRow,>(props: TableBodyProps<TRow>): JSX.Element => {
  const { columns, rows } = props;
  return (
    <tbody>
      {rows.map((row, rowIndex) => (
        <TableBodyRow
          key={rowIndex}
          columns={columns}
          row={row}
          rowIndex={rowIndex}
        />
      ))}
    </tbody>
  );
};

TableBody.displayName = 'TableBody';
