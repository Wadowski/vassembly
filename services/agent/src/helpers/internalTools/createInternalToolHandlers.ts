import { listAgents } from './listAgents';
import { updateTaskToolHandler } from './updateTask';
import { useAgent } from './useAgent';

import type { InternalToolContext, InternalToolHandlerMap } from './types';

export interface CreateInternalToolHandlersParams {
  toolContext: InternalToolContext;
}

export const createInternalToolHandlers = ({
  toolContext,
}: CreateInternalToolHandlersParams): InternalToolHandlerMap => ({
  'list-agents': (args) => listAgents({ args, context: toolContext }),
  'update-task': (args) => updateTaskToolHandler(args),
  'use-agent': (args) => useAgent({ args, context: toolContext }),
});
