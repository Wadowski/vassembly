import type { DynamicStructuredTool } from '@langchain/core/tools';

export interface MergeToolsWithInternalPrecedenceParams {
  internalTools: DynamicStructuredTool[];
  mcpTools: DynamicStructuredTool[];
}

export interface MergeToolsWithInternalPrecedenceResult {
  tools: DynamicStructuredTool[];
  skippedMcpToolNames: string[];
}

export const mergeToolsWithInternalPrecedence = ({
  internalTools,
  mcpTools,
}: MergeToolsWithInternalPrecedenceParams): MergeToolsWithInternalPrecedenceResult => {
  const internalToolNames = new Set(internalTools.map((tool) => tool.name));
  const skippedMcpToolNames: string[] = [];

  const nonConflictingMcpTools = mcpTools.filter((tool) => {
    if (internalToolNames.has(tool.name)) {
      skippedMcpToolNames.push(tool.name);
      return false;
    }

    return true;
  });

  return {
    tools: [...internalTools, ...nonConflictingMcpTools],
    skippedMcpToolNames,
  };
};
