import systemAgentDomain from '@vassembly/domain-system-agent';

import {
  SPECIALIZATION_AGENT_ROLES,
  SPECIALIZATION_AGENT_RULES,
  SPECIALIZATION_PROVISIONING_ADMIN_ID,
} from './constants';

import type { SpecializationAgentRole } from './constants';

const PAGE_SIZE = 100;

export interface BackfillSpecializationAgentRulesResult {
  updatedCount: number;
}

const SYSTEM_TASK_WORKER_AGENT_NAMES = [
  'Task worker',
  'Question worker',
  'Scheduled task worker',
  'Routine task worker',
] as const;

const resolveSpecializationAgentRoleFromName = ({
  name,
}: {
  name: string;
}): SpecializationAgentRole | undefined => {
  const normalizedName = name.trim().toLowerCase();

  if (
    SYSTEM_TASK_WORKER_AGENT_NAMES.some(
      (systemWorkerName) => systemWorkerName.toLowerCase() === normalizedName,
    )
  ) {
    return undefined;
  }

  for (const role of SPECIALIZATION_AGENT_ROLES) {
    if (normalizedName.endsWith(` ${role}`)) {
      return role;
    }
  }

  return undefined;
};

export const backfillSpecializationAgentRules =
  async (): Promise<BackfillSpecializationAgentRulesResult> => {
    let updatedCount = 0;
    let page = 0;
    let totalCount = 0;

    do {
      const result = await systemAgentDomain.queries.getAdminList({
        page,
        size: PAGE_SIZE,
      });
      totalCount = result.totalCount;

      for (const agent of result.items) {
        if (!agent.specializationId || !agent.name) {
          continue;
        }

        const role = resolveSpecializationAgentRoleFromName({ name: agent.name });
        if (role === undefined) {
          continue;
        }

        const expectedRule = SPECIALIZATION_AGENT_RULES[role];
        if (agent.rule === expectedRule) {
          continue;
        }

        await systemAgentDomain.commands.update({
          id: agent.id,
          updatedByAdminId: SPECIALIZATION_PROVISIONING_ADMIN_ID,
          data: {
            rule: expectedRule,
          },
        });

        updatedCount += 1;
      }

      page += 1;
    } while (page * PAGE_SIZE < totalCount);

    return { updatedCount };
  };
