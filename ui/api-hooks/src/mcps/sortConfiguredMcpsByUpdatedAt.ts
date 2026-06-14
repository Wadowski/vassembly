import type { UserConfiguredMcpItem } from './types';

export interface SortConfiguredMcpsByUpdatedAtParams {
  items: UserConfiguredMcpItem[];
}

export const sortConfiguredMcpsByUpdatedAt = ({
  items,
}: SortConfiguredMcpsByUpdatedAtParams): UserConfiguredMcpItem[] =>
  [...items].sort(
    (first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  );
