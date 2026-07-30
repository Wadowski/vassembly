import { mongoDb } from '@vassembly/client-mongodb';

import { INTERNAL_TOOL_USAGE_COLLECTION_NAME } from '../../clients';
import { MAX_TASK_ACTIVITY_INTERNAL_TOOL_EVENTS } from '../../constants';
import { internalToolUsageEventFactory } from '../../model/factories';
import { mapInternalToolUsageEventDocument } from '../../model/mapInternalToolUsageEventDocument';

import type { GetModelsByTaskIdParams, GetModelsByTaskIdResult } from './types';

export const getModelsByTaskId = async ({
  taskId,
}: GetModelsByTaskIdParams): Promise<GetModelsByTaskIdResult> => {
  const collection = mongoDb.db.collection(INTERNAL_TOOL_USAGE_COLLECTION_NAME);
  const rows = await collection
    .find({ taskId })
    .sort({ startedAt: -1 })
    .limit(MAX_TASK_ACTIVITY_INTERNAL_TOOL_EVENTS)
    .toArray();

  const data = rows.map((row) =>
    internalToolUsageEventFactory.create(
      mapInternalToolUsageEventDocument({ document: row as Record<string, unknown> }),
    ),
  );

  return { data };
};
