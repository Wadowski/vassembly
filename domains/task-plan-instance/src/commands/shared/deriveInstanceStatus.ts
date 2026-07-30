import type { TaskPlanInstanceItem, TaskPlanInstanceStatus } from '../../model';
import { TaskPlanInstanceStatus as Status } from '../../model';

export interface DeriveInstanceStatusParams {
  items: TaskPlanInstanceItem[];
}

const ITEM_STATUS_PRECEDENCE: Array<(items: TaskPlanInstanceItem[]) => TaskPlanInstanceStatus | null> = [
  (items) => (items.some((item) => item.status === Status.Failed) ? Status.Failed : null),
  (items) => (items.every((item) => item.status === Status.Done) ? Status.Done : null),
  (items) => (items.some((item) => item.status !== Status.Pending) ? Status.InProgress : null),
];

export const deriveInstanceStatus = ({
  items,
}: DeriveInstanceStatusParams): TaskPlanInstanceStatus => {
  for (const resolveStatus of ITEM_STATUS_PRECEDENCE) {
    const status = resolveStatus(items);

    if (status !== null) {
      return status;
    }
  }

  return Status.Pending;
};
