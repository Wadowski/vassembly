import { getAllInternalTools } from '@vassembly/constants';

const buildLlmToolNameToIdMap = (): Map<string, string> =>
  new Map(getAllInternalTools().map((tool) => [tool.llmToolName, tool.id]));

export interface ExecutedToolResult {
  toolName: string;
  content: string;
}

export interface InternalToolExecutionResult {
  toolId: string;
  content: string;
}

export const mapExecutedToolResultsToIds = (
  executedToolResults: ExecutedToolResult[],
): InternalToolExecutionResult[] => {
  const nameToId = buildLlmToolNameToIdMap();
  const mappedResults: InternalToolExecutionResult[] = [];

  for (const result of executedToolResults) {
    const toolId = nameToId.get(result.toolName);

    if (toolId === undefined) {
      continue;
    }

    mappedResults.push({
      toolId,
      content: result.content,
    });
  }

  return mappedResults;
};
