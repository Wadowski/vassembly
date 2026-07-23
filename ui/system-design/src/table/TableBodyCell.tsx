import { Text } from '@vassembly/ui-system-design/text';
import type { TableBodyCellProps } from './types';

export const TableBodyCell = <TRow,>(
  props: TableBodyCellProps<TRow>,
): JSX.Element => {
  const { column, row } = props;
  if (column.render) {
    return <td>{column.render({ row })}</td>;
  }
  const text = String(row[column.key as keyof TRow] ?? '');
  return (
    <td>
      <Text as="span" variant="body2">
        {text}
      </Text>
    </td>
  );
};

TableBodyCell.displayName = 'TableBodyCell';
