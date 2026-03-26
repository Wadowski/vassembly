import { KeyboardArrowLeftIcon, KeyboardArrowRightIcon } from '@vassembly/ui-icons';
import { resolveClassName } from '@vassembly/ui-utils';
import { getVisiblePageItems } from './getVisiblePageItems';
import { PaginationPageList } from './PaginationPageList';
import styles from './Pagination.module.scss';
import type { PaginationProps } from './types';

export const Pagination = (props: PaginationProps): JSX.Element | null => {
  const {
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    className,
    ariaLabel = 'Pagination',
  } = props;

  if (totalPages < 2) {
    return null;
  }

  const pageItems = getVisiblePageItems({
    totalPages,
    currentPage,
    siblingCount,
  });

  const isPreviousDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  const handlePrevious = (): void => {
    if (!isPreviousDisabled) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = (): void => {
    if (!isNextDisabled) {
      onPageChange(currentPage + 1);
    }
  };

  const navClassName = resolveClassName(styles.nav, className);

  return (
    <nav aria-label={ariaLabel} className={navClassName}>
      <button
        type="button"
        className={styles.navButton}
        aria-label="Previous page"
        disabled={isPreviousDisabled}
        onClick={handlePrevious}
      >
        <KeyboardArrowLeftIcon />
      </button>
      <PaginationPageList
        pageItems={pageItems}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
      <button
        type="button"
        className={styles.navButton}
        aria-label="Next page"
        disabled={isNextDisabled}
        onClick={handleNext}
      >
        <KeyboardArrowRightIcon />
      </button>
    </nav>
  );
};

Pagination.displayName = 'Pagination';
