const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, index) => start + index);

export const getVisiblePageItems = (params: {
  totalPages: number;
  currentPage: number;
  siblingCount: number;
}): (number | 'ellipsis')[] => {
  const { totalPages, currentPage, siblingCount } = params;

  if (totalPages <= 0) {
    return [];
  }

  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + siblingCount * 2;
    const leftRange = range(1, leftItemCount);
    return [...leftRange, 'ellipsis', totalPages];
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + siblingCount * 2;
    const rightRange = range(totalPages - rightItemCount + 1, totalPages);
    return [1, 'ellipsis', ...rightRange];
  }

  if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const middleRange = range(leftSiblingIndex, rightSiblingIndex);
    return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
  }

  return range(1, totalPages);
};
