export const MAX_PAGE_SIZE = 50;

export interface ResolvePageSizeParams {
  size: number;
}

export const resolvePageSize = ({ size }: ResolvePageSizeParams): number =>
  Math.min(size, MAX_PAGE_SIZE);
