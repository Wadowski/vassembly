import type { BuildPlanItemMessageParams } from './buildPlanItemMessage';

export const buildPlanItemResearcherMessage = ({
  templateItemIndex,
  description,
  inputSlice,
}: Pick<BuildPlanItemMessageParams, 'templateItemIndex' | 'description' | 'inputSlice'>): string => {
  return [
    `Gather data for plan item ${templateItemIndex + 1}.`,
    `Data to collect: ${description}`,
    `Context: ${JSON.stringify(inputSlice)}`,
    'Use web_search, web_page_content, and assigned MCP tools. Return Findings, Sources, and create a data-gathering script skill when retrieval must be repeatable.',
  ].join('\n');
};
