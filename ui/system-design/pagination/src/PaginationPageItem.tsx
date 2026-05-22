import { Button } from '@vassembly/ui-button';
import { resolveClassName } from '@vassembly/ui-utils';
import styles from './Pagination.module.scss';
import type { PaginationPageItemProps } from './types';

export const PaginationPageItem = (props: PaginationPageItemProps): JSX.Element => {
  const { pageNumber, currentPage, onPageChange } = props;
  const isCurrent = pageNumber === currentPage;

  return (
    <li className={styles.item}>
      <Button
        text={String(pageNumber)}
        variant="text"
        size="small"
        color="primary"
        isDisabled={isCurrent}
        onClick={() => {
          if (!isCurrent) {
            onPageChange(pageNumber);
          }
        }}
        className={resolveClassName(isCurrent && styles.pageButtonCurrent)}
        aria-label={`Page ${pageNumber}`}
        aria-current={isCurrent ? 'page' : undefined}
      />
    </li>
  );
};

PaginationPageItem.displayName = 'PaginationPageItem';
