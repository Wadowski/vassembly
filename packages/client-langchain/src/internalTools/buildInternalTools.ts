import { DynamicStructuredTool } from '@langchain/core/tools';
import { getInternalToolById } from '@vassembly/constants';
import type { ZodObject, ZodRawShape } from 'zod';

import { listAgentsSchema } from './schemas/listAgentsSchema';
import { useAgentSchema } from './schemas/useAgentSchema';

import type { BuildInternalToolsParams, BuildInternalToolsResult } from './types';

const INTERNAL_TOOL_SCHEMAS: Record<string, ZodObject<ZodRawShape>> = {
  'use-agent': useAgentSchema,
  'list-agents': listAgentsSchema,
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
