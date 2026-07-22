import { KeyboardArrowLeftIcon, KeyboardArrowRightIcon } from '@vassembly/ui-system-design/icons';
import { Button } from '@vassembly/ui-system-design/button';
import { resolveClassName } from '@vassembly/ui-system-design/utils';
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
      <Button
        icon={KeyboardArrowLeftIcon}
        variant="text"
        size="small"
        color="primary"
        isDisabled={isPreviousDisabled}
        onClick={handlePrevious}
        text="Previous"
        aria-label="Previous"
      />
      <PaginationPageList
        pageItems={pageItems}
        currentPage={currentPage}
        onPageChange={onPageChange}
      />
      <Button
        icon={KeyboardArrowRightIcon}
        variant="text"
        size="small"
        color="primary"
        isDisabled={isNextDisabled}
        onClick={handleNext}
        text="Next"
        aria-label="Next"
      />
    </nav>
  );
};

Pagination.displayName = 'Pagination';
