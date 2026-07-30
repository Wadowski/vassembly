const ITEM_STATUS_DISPLAY: Record<
  string,
  { label: string; colorClass: string }
> = {
  pending: { label: 'Pending', colorClass: 'pending' },
  'in-progress': { label: 'In progress', colorClass: 'inProgress' },
  done: { label: 'Done', colorClass: 'done' },
  failed: { label: 'Failed', colorClass: 'failed' },
};

export interface GetPlanItemStatusDisplayParams {
  status: string;
}

const DEFAULT_STATUS_DISPLAY = { label: 'Pending', colorClass: 'pending' };

export const getPlanItemStatusDisplay = ({
  status,
}: GetPlanItemStatusDisplayParams): { label: string; colorClass: string } => {
  return ITEM_STATUS_DISPLAY[status] ?? DEFAULT_STATUS_DISPLAY;
};
