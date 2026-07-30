import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../constants';

export interface ResolvePaginationParams {
  page?: number;
  size?: number;
}

export interface ResolvedPagination {
  page: number;
  size: number;
  skip: number;
}

export const resolvePagination = ({
  page = DEFAULT_PAGE,
  size = DEFAULT_PAGE_SIZE,
}: ResolvePaginationParams): ResolvedPagination => {
  const cappedSize = Math.min(size, MAX_PAGE_SIZE);

  return {
    page,
    size: cappedSize,
    skip: page * cappedSize,
  };
};
