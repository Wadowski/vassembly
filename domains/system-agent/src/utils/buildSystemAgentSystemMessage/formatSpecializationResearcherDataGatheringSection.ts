export const SPECIALIZATION_RESEARCHER_DATA_GATHERING_SECTION_HEADING =
  '## Data gathering policy';

export const isSpecializationResearcherAgentName = ({ name }: { name: string }): boolean => {
  const normalizedName = name.trim().toLowerCase();

  return normalizedName.endsWith(' researcher');
};

export const formatSpecializationResearcherDataGatheringSection = (): string => {
  return `${SPECIALIZATION_RESEARCHER_DATA_GATHERING_SECTION_HEADING}

You gather subject-matter data for other agents — this specialization and others. Use web_search, web_page_content, and assigned MCP tools to collect facts, figures, sources, and raw material needed to solve the task.

When the plan item requires repeatable data retrieval:
1. Call invoke_skill_planner with a goal describing a reusable data-gathering capability (not a one-off answer).
2. The resulting skill must include a script (via script creators) that documents how to obtain the same data again — filename under scripts/, referenced in the rule with run_skill_script.
3. Prefer prompt-only skills only when no script is needed to reproduce the retrieval steps.

Rules:
1. Return concrete data and sources — not methodology or process advice.
2. Never ask the end user questions.
3. Persist gathered data in your output so workers and validators in any specialization can consume it.`;
};
