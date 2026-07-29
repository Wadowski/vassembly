import { askUserSchema } from '../schemas/askUserSchema';
import { classifySpecializationSchema } from '../schemas/classifySpecializationSchema';
import { createSkillSchema } from '../schemas/createSkillSchema';
import { createSpecializationSchema } from '../schemas/createSpecializationSchema';
import { invokeSkillPlannerSchema } from '../schemas/invokeSkillPlannerSchema';
import { listAgentsSchema } from '../schemas/listAgentsSchema';
import {
  persistTaskPlanSchema,
  persistTaskPlanShapeCoercion,
  transformPersistTaskPlanShapedInput,
} from '../schemas/parsePersistTaskPlanInput';
import { resolveSkillSchema } from '../schemas/resolveSkillSchema';
import { runSkillScriptSchema } from '../schemas/runSkillScriptSchema';
import { updateTaskSchema } from '../schemas/updateTaskSchema';
import { useAgentSchema } from '../schemas/useAgentSchema';
import { webPageContentSchema } from '../schemas/webPageContentSchema';
import { webSearchSchema } from '../schemas/webSearchSchema';

import type { ToolNormalizer } from './types';

export const TOOL_NORMALIZERS: Record<string, ToolNormalizer> = {
  'user-ask': {
    schema: askUserSchema,
    shapeCoercion: {},
  },
  'agent-use': {
    schema: useAgentSchema,
    shapeCoercion: {},
  },
  'agent-list': {
    schema: listAgentsSchema,
    shapeCoercion: {
      arrayDefaultFields: ['specializationIds'],
      nullableToUndefinedFields: ['specializationIds', 'role'],
    },
  },
  'task-update': {
    schema: updateTaskSchema,
    shapeCoercion: {
      nullableToUndefinedFields: ['taskId', 'title', 'category', 'specializationIds'],
    },
  },
  'specialization-classify': {
    schema: classifySpecializationSchema,
    shapeCoercion: {
      nullableToUndefinedFields: ['taskId'],
    },
  },
  'specialization-create': {
    schema: createSpecializationSchema,
    shapeCoercion: {},
  },
  'skill-create': {
    schema: createSkillSchema,
    shapeCoercion: {
      arrayDefaultFields: ['scripts', 'usesSkillIds'],
    },
  },
  'skill-resolve': {
    schema: resolveSkillSchema,
    shapeCoercion: {
      nullableToUndefinedFields: ['specializationId'],
    },
  },
  'skill-run-script': {
    schema: runSkillScriptSchema,
    shapeCoercion: {
      nullableToUndefinedFields: ['specializationId', 'input', 'env', 'args'],
      recordJsonFields: ['input', 'env'],
      arrayDefaultFields: ['args'],
    },
  },
  'skill-plan': {
    schema: invokeSkillPlannerSchema,
    shapeCoercion: {
      nullableToUndefinedFields: ['specializationId'],
    },
  },
  'task-plan-persist': {
    schema: persistTaskPlanSchema,
    shapeCoercion: persistTaskPlanShapeCoercion,
    transformShapedInput: transformPersistTaskPlanShapedInput,
  },
  'web-search': {
    schema: webSearchSchema,
    shapeCoercion: {},
  },
  'web-page-content': {
    schema: webPageContentSchema,
    shapeCoercion: {},
  },
};
