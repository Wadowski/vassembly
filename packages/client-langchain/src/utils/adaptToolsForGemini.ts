import { DynamicStructuredTool } from '@langchain/core/tools';
import { toJsonSchema } from '@langchain/core/utils/json_schema';

import { sanitizeJsonSchemaForGemini } from './sanitizeJsonSchemaForGemini/index';

export interface AdaptToolsForGeminiParams {
  tools: DynamicStructuredTool[];
}

export const adaptToolsForGemini = ({
  tools,
}: AdaptToolsForGeminiParams): DynamicStructuredTool[] => {
  return tools.map((tool) => {
    const jsonSchema = toJsonSchema(tool.schema);
    const sanitizedSchema = sanitizeJsonSchemaForGemini({ schema: jsonSchema });

    return new DynamicStructuredTool({
      name: tool.name,
      description: tool.description,
      schema: sanitizedSchema,
      func: tool.func,
    });
  });
};
