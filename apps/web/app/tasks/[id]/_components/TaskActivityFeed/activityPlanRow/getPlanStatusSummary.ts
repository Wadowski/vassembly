import type { TaskActivityItemDto } from '@vassembly/ui-api-hooks';

export interface GetPlanStatusSummaryParams {
  status: string;
  planItems: NonNullable<TaskActivityItemDto['planItems']>;
}

export const getPlanStatusSummary = ({
  status,
  planItems,
}: GetPlanStatusSummaryParams): string => {
  const orderValues = [...new Set(planItems.map((item) => item.order))].sort((left, right) => left - right);

  if (status === 'pending') {
    return 'Pending';
  }

  if (status === 'done') {
    return 'Completed';
  }

  if (status === 'failed') {
    const failedOrder = planItems.find((item) => item.status === 'failed')?.order ?? orderValues[0];
    return `Failed at step ${failedOrder}`;
  }

  const startedOrders = planItems
    .filter((item) => item.status !== 'pending')
    .map((item) => item.order);
  const current = startedOrders.length > 0 ? Math.max(...startedOrders) : orderValues[0] ?? 1;

  return `In progress — step ${current} of ${orderValues.length}`;
};
