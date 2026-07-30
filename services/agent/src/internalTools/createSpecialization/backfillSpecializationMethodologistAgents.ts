import specializationDomain from '@vassembly/domain-specialization';

import { provisionSpecializationAgents } from './provisionSpecializationAgents';

const PAGE_SIZE = 100;

export interface BackfillSpecializationMethodologistAgentsResult {
  provisionedCount: number;
}

export const backfillSpecializationMethodologistAgents =
  async (): Promise<BackfillSpecializationMethodologistAgentsResult> => {
    let provisionedCount = 0;
    let page = 0;
    let totalCount = 0;

    do {
      const result = await specializationDomain.queries.getList({
        page,
        size: PAGE_SIZE,
      });
      totalCount = result.total;

      for (const specialization of result.items) {
        if (!specialization.id || !specialization.name) {
          continue;
        }

        const provisionResult = await provisionSpecializationAgents({
          specializationId: specialization.id,
          specializationName: specialization.name,
        });

        if (provisionResult.createdAgentIds.length > 0) {
          provisionedCount += provisionResult.createdAgentIds.length;
        }
      }

      page += 1;
    } while (page * PAGE_SIZE < totalCount);

    return { provisionedCount };
  };
