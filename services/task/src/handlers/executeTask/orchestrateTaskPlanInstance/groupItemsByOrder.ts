import type { TaskPlanInstanceItem } from '@vassembly/domain-task-plan-instance';

export interface GroupItemsByOrderParams {
  items: TaskPlanInstanceItem[];
}

export const groupItemsByOrder = ({
  items,
}: GroupItemsByOrderParams): TaskPlanInstanceItem[][] => {
  const orderValues = [...new Set(items.map((item) => item.order))].sort((left, right) => left - right);

  return orderValues.map((order) =>
    items.filter((item) => item.order === order).sort((left, right) => left.templateItemIndex - right.templateItemIndex),
  );
};
