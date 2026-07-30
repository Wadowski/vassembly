import { withNormalizedInput } from '@vassembly/client-langchain';

import { persistTaskPlanToolHandler } from './persistTaskPlan';
import type { PersistTaskPlanInput } from './persistTaskPlan/types';
import { runSkillScriptToolHandler } from './runSkillScript';
import { invokeSkillPlannerToolHandler } from './invokeSkillPlanner';
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
  'agent-list': withNormalizedInput({
    toolId: 'agent-list',
    handler: (args) => listAgents({ args, context: toolContext }),
  }),
  'task-update': withNormalizedInput({
    toolId: 'task-update',
    handler: (args) => updateTaskToolHandler(args, toolContext),
  }),
  'user-ask': withNormalizedInput({
    toolId: 'user-ask',
    handler: (args) => askUser({ args, context: toolContext }),
  }),
  'agent-use': withNormalizedInput({
    toolId: 'agent-use',
    handler: (args) => useAgent({ args, context: toolContext }),
  }),
  'specialization-classify': withNormalizedInput({
    toolId: 'specialization-classify',
    handler: (args) => classifySpecializationToolHandler(args, toolContext),
  }),
  'specialization-create': withNormalizedInput({
    toolId: 'specialization-create',
    handler: (args) => createSpecializationToolHandler(args, toolContext),
  }),
  'skill-create': withNormalizedInput({
    toolId: 'skill-create',
    handler: (args) => createSkillToolHandler(args),
  }),
  'skill-resolve': withNormalizedInput({
    toolId: 'skill-resolve',
    handler: (args) => resolveSkillToolHandler(args, toolContext),
  }),
  'skill-run-script': withNormalizedInput({
    toolId: 'skill-run-script',
    handler: (args) => runSkillScriptToolHandler(args, toolContext),
  }),
  'skill-plan': withNormalizedInput({
    toolId: 'skill-plan',
    handler: (args) => invokeSkillPlannerToolHandler(args, toolContext),
  }),
  'task-plan-persist': withNormalizedInput({
    toolId: 'task-plan-persist',
    handler: (args) => persistTaskPlanToolHandler(args as unknown as PersistTaskPlanInput, toolContext),
  }),
  'web-search': withNormalizedInput({
    toolId: 'web-search',
    handler: (args) => webSearch({ args }),
  }),
  'web-page-content': withNormalizedInput({
    toolId: 'web-page-content',
    handler: (args) => webPageContent({ args }),
  }),
});
