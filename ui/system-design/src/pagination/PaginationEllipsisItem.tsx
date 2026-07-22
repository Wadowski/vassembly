import { Text } from '@vassembly/ui-system-design/text';
import styles from './Pagination.module.scss';

export const PaginationEllipsisItem = (): JSX.Element => (
  <li className={styles.item}>
    <span aria-hidden="true" className={styles.ellipsis}>
      <Text variant="body2" as="span">
        …
      </Text>
    </span>
  </li>
);

PaginationEllipsisItem.displayName = 'PaginationEllipsisItem';
