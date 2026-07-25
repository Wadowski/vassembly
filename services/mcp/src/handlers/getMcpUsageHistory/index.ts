import agentDomain from '@vassembly/domain-agent';
import mcpUsageDomain from '@vassembly/domain-mcp-usage';
import systemAgentDomain from '@vassembly/domain-system-agent';
import taskDomain from '@vassembly/domain-task';

import type { GetMcpUsageHistoryInput, GetMcpUsageHistoryResult } from './types';

const resolveAgentName = async ({
  agentId,
  userId,
}: {
  agentId: string;
  userId: string;
}): Promise<string | null> => {
  const systemAgentResult = await systemAgentDomain.queries.getActiveById({ id: agentId });

  if (systemAgentResult.data?.name) {
    return systemAgentResult.data.name;
  }

  try {
    const personalAgentResult = await agentDomain.queries.getById({ id: agentId, userId });

    return personalAgentResult.data?.name ?? null;
  } catch {
    return null;
  }
};

const resolveTaskTitle = async ({ taskId }: { taskId: string }): Promise<string | null> => {
  const taskResult = await taskDomain.queries.getModelById({ id: taskId });

  return taskResult.data?.title ?? null;
};

export const getMcpUsageHistory = async ({
  mcpId,
  userId,
  page,
  size,
}: GetMcpUsageHistoryInput): Promise<GetMcpUsageHistoryResult> => {
  const history = await mcpUsageDomain.queries.getListByMcpId({
    mcpId,
    userId,
    page,
    size,
  });

  const agentIds = [...new Set(history.items.map((item) => item.agentId))];
  const taskIds = [
    ...new Set(history.items.map((item) => item.taskId).filter((taskId): taskId is string => !!taskId)),
  ];

  const agentNameEntries = await Promise.all(
    agentIds.map(async (agentId) => {
      const name = await resolveAgentName({ agentId, userId });
      return [agentId, name] as const;
    }),
  );
  const agentNameById = new Map(
    agentNameEntries.filter((entry): entry is [string, string] => entry[1] !== null),
  );

  const taskTitleEntries = await Promise.all(
    taskIds.map(async (taskId) => {
      const title = await resolveTaskTitle({ taskId });
      return [taskId, title] as const;
    }),
  );
  const taskTitleById = new Map(
    taskTitleEntries.filter((entry): entry is [string, string] => entry[1] !== null),
  );

  const items = history.items.map((item) => ({
    ...item,
    agentName: agentNameById.get(item.agentId) ?? null,
    taskTitle: item.taskId ? (taskTitleById.get(item.taskId) ?? null) : null,
  }));

  return {
    items,
    total: history.total,
    page: history.page,
    size: history.size,
  };
};
