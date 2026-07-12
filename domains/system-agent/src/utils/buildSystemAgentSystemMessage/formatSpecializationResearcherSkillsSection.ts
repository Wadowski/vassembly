export const SPECIALIZATION_RESEARCHER_SKILLS_SECTION_HEADING = '## Skill catalog policy';

export const isSpecializationResearcherAgentName = ({ name }: { name: string }): boolean => {
  const normalizedName = name.trim().toLowerCase();

  return normalizedName.endsWith(' researcher');
};

export const formatSpecializationResearcherSkillsSection = (): string => {
  return `${SPECIALIZATION_RESEARCHER_SKILLS_SECTION_HEADING}

The "## Available Skills" section (when present) is the complete list of skills in this specialization. You may ONLY suggest names that appear there — copy each name exactly (case, hyphens, spelling).

Rules:
1. Never invent, guess, or paraphrase skill names (e.g. do not create names like "network-connectivity-test" unless that exact name is in the catalog).
2. If "## Available Skills" is missing or empty, set Suggested skills: none and describe all executable work under Gaps requiring new skills.
3. If no catalog skill fits the goal, set Suggested skills: none and put the work under Gaps requiring new skills — never fabricate a skill name.`;
};
