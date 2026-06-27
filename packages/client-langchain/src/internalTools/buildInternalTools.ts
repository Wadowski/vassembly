import { DynamicStructuredTool } from '@langchain/core/tools';
import { getInternalToolById } from '@vassembly/constants';
import type { ZodObject, ZodRawShape } from 'zod';

import { askUserSchema } from './schemas/askUserSchema';
import { classifySpecializationSchema } from './schemas/classifySpecializationSchema';
import { createSkillSchema } from './schemas/createSkillSchema';
import { resolveSkillSchema } from './schemas/resolveSkillSchema';
import { createSpecializationSchema } from './schemas/createSpecializationSchema';
import { listAgentsSchema } from './schemas/listAgentsSchema';
import { updateTaskSchema } from './schemas/updateTaskSchema';
import { useAgentSchema } from './schemas/useAgentSchema';
import { webPageContentSchema } from './schemas/webPageContentSchema';
import { webSearchSchema } from './schemas/webSearchSchema';

import type { BuildInternalToolsParams, BuildInternalToolsResult } from './types';

const INTERNAL_TOOL_SCHEMAS: Record<string, ZodObject<ZodRawShape>> = {
  'user-ask': askUserSchema,
  'agent-use': useAgentSchema,
  'agent-list': listAgentsSchema,
  'task-update': updateTaskSchema,
  'specialization-classify': classifySpecializationSchema,
  'specialization-create': createSpecializationSchema,
  'skill-create': createSkillSchema,
  'skill-resolve': resolveSkillSchema,
  'web-search': webSearchSchema,
  'web-page-content': webPageContentSchema,
};

export const buildInternalTools = ({
  toolIds,
  handlers,
}: BuildInternalToolsParams): BuildInternalToolsResult => {
  const tools: DynamicStructuredTool[] = [];
  const boundToolIds: string[] = [];
  const skippedToolIds: string[] = [];

  for (const toolId of toolIds) {
    const definition = getInternalToolById(toolId);
    const handler = handlers[toolId];
    const schema = INTERNAL_TOOL_SCHEMAS[toolId];

    if (!definition || !handler || !schema) {
      skippedToolIds.push(toolId);
      continue;
    }

    tools.push(
      new DynamicStructuredTool({
        name: definition.llmToolName,
        description: definition.description,
        schema,
        func: handler,
      }),
    );
    boundToolIds.push(toolId);
  }

  return {
    tools,
    boundToolIds,
    skippedToolIds,
  };
};
