import { Text } from '@vassembly/ui-text';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Pagination.module.scss';
import type { PaginationPageItemProps } from './types';

export const PaginationPageItem = (props: PaginationPageItemProps): JSX.Element => {
  const { pageNumber, currentPage, onPageChange } = props;
  const isCurrent = pageNumber === currentPage;

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={resolveClassName(
          styles.pageButton,
          isCurrent && styles.pageButtonCurrent,
        )}
        aria-label={`Page ${pageNumber}`}
        aria-current={isCurrent ? 'page' : undefined}
        onClick={() => {
          if (!isCurrent) {
            onPageChange(pageNumber);
          }
        }}
      >
        <Text variant="body2" as="span">
          {pageNumber}
        </Text>
      </button>
    </li>
  );
};

PaginationPageItem.displayName = 'PaginationPageItem';
