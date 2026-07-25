import { mongoDb } from '@vassembly/client-mongodb';

import { MCP_USAGE_COLLECTION_NAME } from '../../clients';
import { MAX_TASK_ACTIVITY_MCP_EVENTS } from '../../constants';
import { mcpUsageEventFactory } from '../../model/factories';
import { mapMcpUsageEventDocument } from '../../model/mapMcpUsageEventDocument';

import type { McpUsageEventModel } from '../../model';
import type { GetModelsByTaskIdParams, GetModelsByTaskIdResult } from './types';

export const getModelsByTaskId = async ({
  taskId,
}: GetModelsByTaskIdParams): Promise<GetModelsByTaskIdResult> => {
  const collection = mongoDb.db.collection(MCP_USAGE_COLLECTION_NAME);
  const rows = await collection
    .find({ taskId })
    .sort({ startedAt: -1 })
    .limit(MAX_TASK_ACTIVITY_MCP_EVENTS)
    .toArray();

  const data = rows.map((row) =>
    mcpUsageEventFactory.create(
      mapMcpUsageEventDocument({ document: row as Record<string, unknown> }),
    ),
  );

  return { data };
};
