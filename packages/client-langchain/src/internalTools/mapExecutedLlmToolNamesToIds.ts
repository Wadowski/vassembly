import { getAllInternalTools } from '@vassembly/constants';

const buildLlmToolNameToIdMap = (): Map<string, string> =>
  new Map(getAllInternalTools().map((tool) => [tool.llmToolName, tool.id]));

export const mapExecutedLlmToolNamesToIds = (executedLlmToolNames: string[]): string[] => {
  const nameToId = buildLlmToolNameToIdMap();
  const usedIds: string[] = [];

  for (const name of executedLlmToolNames) {
    const toolId = nameToId.get(name);
    if (toolId === undefined || usedIds.includes(toolId)) {
      continue;
    }

    usedIds.push(toolId);
  }

  return usedIds;
};
