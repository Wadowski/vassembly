import systemAgentDomain from '@vassembly/domain-system-agent';

import {
  SPECIALIZATION_AGENT_TOOL_IDS,
  SPECIALIZATION_PROVISIONING_ADMIN_ID,
} from './constants';

const PAGE_SIZE = 100;

export interface BackfillSpecializationAgentToolsResult {
  updatedCount: number;
}

const hasAllSpecializationTools = ({
  assignedToolIds,
}: {
  assignedToolIds: string[];
}): boolean =>
  SPECIALIZATION_AGENT_TOOL_IDS.every((toolId) => assignedToolIds.includes(toolId));

export const backfillSpecializationAgentTools =
  async (): Promise<BackfillSpecializationAgentToolsResult> => {
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
        if (!agent.specializationId) {
          continue;
        }

        if (hasAllSpecializationTools({ assignedToolIds: agent.assignedToolIds })) {
          continue;
        }

        const mergedToolIds = [
          ...new Set([...agent.assignedToolIds, ...SPECIALIZATION_AGENT_TOOL_IDS]),
        ];

        await systemAgentDomain.commands.update({
          id: agent.id,
          updatedByAdminId: SPECIALIZATION_PROVISIONING_ADMIN_ID,
          data: {
            assignedToolIds: mergedToolIds,
          },
        });

        updatedCount += 1;
      }

      page += 1;
    } while (page * PAGE_SIZE < totalCount);

    return { updatedCount };
  };
