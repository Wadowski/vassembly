import { PaginationEllipsisItem } from './PaginationEllipsisItem';
import { PaginationPageItem } from './PaginationPageItem';
import styles from './Pagination.module.scss';
import type { PaginationPageListProps } from './types';

export const PaginationPageList = (props: PaginationPageListProps): JSX.Element => {
  const { pageItems, currentPage, onPageChange } = props;

  return (
    <ol className={styles.list}>
      {pageItems.map((item: number | 'ellipsis', index: number) => {
        if (item === 'ellipsis') {
          return <PaginationEllipsisItem key={`ellipsis-${index}`} />;
        }

        return (
          <PaginationPageItem
            key={item}
            pageNumber={item}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        );
      })}
    </ol>
  );
};

PaginationPageList.displayName = 'PaginationPageList';
