import systemAgentDomain from '@vassembly/domain-system-agent';

import { SPECIALIZATION_AGENT_RULES, SPECIALIZATION_PROVISIONING_ADMIN_ID } from './constants';
import { resolveSpecializationAgentRole } from './resolveSpecializationAgentRole';

const PAGE_SIZE = 100;

export interface BackfillSpecializationAgentRulesResult {
  updatedCount: number;
}

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

        const role = resolveSpecializationAgentRole({ name: agent.name });
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
