import { ListBulletsIcon } from '@vassembly/ui-icons';
import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import { DEFAULT_EMPTY_STATE_TEXT } from './constants';
import styles from './TableEmptyState.module.scss';
import type { TableEmptyStateProps } from './types';

export const TableEmptyState = <TRow,>(
  props: TableEmptyStateProps<TRow>,
): JSX.Element => {
  const { columns, emptyState } = props;
  const content = emptyState ?? DEFAULT_EMPTY_STATE_TEXT;
  const colSpan = Math.max(1, columns.length);
  const cellClassName = resolveClassName(styles.emptyCell);
  return (
    <tbody>
      <tr>
        <td className={cellClassName} colSpan={colSpan}>
          <div className={styles.wrapper} role="status">
            <span aria-hidden className={styles.icon}>
              <ListBulletsIcon className={styles.iconSvg} />
            </span>
            <Text as="span" variant="body1">
              {content}
            </Text>
          </div>
        </td>
      </tr>
    </tbody>
  );
};

TableEmptyState.displayName = 'TableEmptyState';
