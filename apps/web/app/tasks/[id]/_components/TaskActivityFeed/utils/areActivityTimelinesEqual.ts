import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

export const areActivityTimelinesEqual = (
  left: TaskActivityItemDto[],
  right: TaskActivityItemDto[],
): boolean => JSON.stringify(left) === JSON.stringify(right);
