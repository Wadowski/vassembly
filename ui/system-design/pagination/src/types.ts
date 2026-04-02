export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
  ariaLabel?: string;
}

export interface PaginationPageListProps {
  pageItems: (number | 'ellipsis')[];
  currentPage: number;
  onPageChange: (page: number) => void;
}

export interface PaginationPageItemProps {
  pageNumber: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}
