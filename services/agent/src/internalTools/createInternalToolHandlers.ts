import { listAgents } from './listAgents';
import { askUser } from './askUser';
import { classifySpecializationToolHandler } from './classifySpecialization';
import { createSkillToolHandler } from './createSkill';
import { createSpecializationToolHandler } from './createSpecialization';
import { resolveSkillToolHandler } from './resolveSkill';
import { updateTaskToolHandler } from './updateTask';
import { useAgent } from './useAgent';
import { webPageContent } from './webPageContent';
import { webSearch } from './webSearch';

import type { InternalToolContext, InternalToolHandlerMap } from './types';

export interface CreateInternalToolHandlersParams {
  toolContext: InternalToolContext;
}

export const createInternalToolHandlers = ({
  toolContext,
}: CreateInternalToolHandlersParams): InternalToolHandlerMap => ({
  'agent-list': (args) => listAgents({ args, context: toolContext }),
  'task-update': (args) => updateTaskToolHandler(args),
  'user-ask': (args) => askUser({ args, context: toolContext }),
  'agent-use': (args) => useAgent({ args, context: toolContext }),
  'specialization-classify': (args) => classifySpecializationToolHandler(args, toolContext),
  'specialization-create': (args) => createSpecializationToolHandler(args, toolContext),
  'skill-create': (args) => createSkillToolHandler(args),
  'skill-resolve': (args) => resolveSkillToolHandler(args, toolContext),
  'web-search': (args) => webSearch({ args }),
  'web-page-content': (args) => webPageContent({ args }),
});
