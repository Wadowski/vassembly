import type { ListAgentRow } from './types';

export type SpecializationAgentRole = 'researcher' | 'worker' | 'validator';

export interface FilterAgentsByRoleParams {
  agents: ListAgentRow[];
  role?: SpecializationAgentRole;
}

export const resolveAgentRoleFromArgs = (
  args: Record<string, unknown>,
): SpecializationAgentRole | undefined => {
  const role = args.role;

  if (role === 'researcher' || role === 'worker' || role === 'validator') {
    return role;
  }

  return undefined;
};

export const filterAgentsByRole = ({
  agents,
  role,
}: FilterAgentsByRoleParams): ListAgentRow[] => {
  if (role === undefined) {
    return agents;
  }

  const suffix = ` ${role}`;

  return agents.filter((agent) => agent.name.toLowerCase().endsWith(suffix));
};
