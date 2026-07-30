import { SPECIALIZATION_AGENT_ROLES } from './constants';

import type { SpecializationAgentRole } from './constants';

const SYSTEM_TASK_WORKER_AGENT_NAMES = [
  'Task worker',
  'Question worker',
  'Scheduled task worker',
  'Routine task worker',
] as const;

export interface ResolveSpecializationAgentRoleParams {
  name: string;
}

export const resolveSpecializationAgentRole = ({
  name,
}: ResolveSpecializationAgentRoleParams): SpecializationAgentRole | undefined => {
  const normalizedName = name.trim().toLowerCase();

  if (
    SYSTEM_TASK_WORKER_AGENT_NAMES.some(
      (systemWorkerName) => systemWorkerName.toLowerCase() === normalizedName,
    )
  ) {
    return undefined;
  }

  return SPECIALIZATION_AGENT_ROLES.find((role) => normalizedName.endsWith(` ${role}`));
};
