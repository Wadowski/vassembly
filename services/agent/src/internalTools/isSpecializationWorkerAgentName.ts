export const SYSTEM_TASK_WORKER_AGENT_NAMES = [
  'Task worker',
  'Question worker',
  'Scheduled task worker',
  'Routine task worker',
] as const;

export const isSpecializationWorkerAgentName = ({ name }: { name: string }): boolean => {
  const normalizedName = name.trim();

  if (!normalizedName.endsWith(' worker')) {
    return false;
  }

  return !SYSTEM_TASK_WORKER_AGENT_NAMES.some(
    (systemWorkerName) => systemWorkerName.toLowerCase() === normalizedName.toLowerCase(),
  );
};
