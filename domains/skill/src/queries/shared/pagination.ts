export const DEFAULT_PAGE = 0;

export const DEFAULT_SIZE = 20;

export const MAX_PAGE_SIZE = 50;

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
  size = DEFAULT_SIZE,
}: ResolvePaginationParams): ResolvedPagination => {
  const cappedSize = Math.min(size, MAX_PAGE_SIZE);

  return {
    page,
    size: cappedSize,
    skip: page * cappedSize,
  };
};
