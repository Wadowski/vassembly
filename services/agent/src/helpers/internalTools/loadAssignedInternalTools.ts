import { getInternalToolById } from '@vassembly/constants';

import { createInternalToolHandlers } from './createInternalToolHandlers';

import type {
  InternalToolBinding,
  LoadAssignedInternalToolsParams,
  LoadAssignedInternalToolsResult,
} from './types';

export const loadAssignedInternalTools = async ({
  assignedToolIds,
  toolContext,
}: LoadAssignedInternalToolsParams): Promise<LoadAssignedInternalToolsResult> => {
  const handlers = createInternalToolHandlers({ toolContext });
  const bindings: InternalToolBinding[] = [];
  const boundToolIds: string[] = [];
  const skippedToolIds: string[] = [];

  for (const toolId of assignedToolIds) {
    const definition = getInternalToolById(toolId);
    const handler = handlers[toolId];

    if (!definition || !handler) {
      skippedToolIds.push(toolId);
      continue;
    }

    bindings.push({ toolId, handler });
    boundToolIds.push(toolId);
  }

  return { bindings, boundToolIds, skippedToolIds };
};
