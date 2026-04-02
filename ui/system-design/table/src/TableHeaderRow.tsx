import { Text } from '@vassembly/ui-text';
import type { TableHeaderRowProps } from './types';

export const TableHeaderRow = <TRow,>(
  props: TableHeaderRowProps<TRow>,
): JSX.Element => {
  const { columns } = props;
  return (
    <tr>
      {columns.map((column) => (
        <th key={column.key} scope="col">
          <Text as="span" variant="label">
            {column.header}
          </Text>
        </th>
      ))}
    </tr>
  );
};

TableHeaderRow.displayName = 'TableHeaderRow';
