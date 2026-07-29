export const SPECIALIZATION_RESEARCHER_SKILLS_SECTION_HEADING = '## Skill catalog policy';

export const isSpecializationResearcherAgentName = ({ name }: { name: string }): boolean => {
  const normalizedName = name.trim().toLowerCase();

  return normalizedName.endsWith(' researcher');
};

export const formatSpecializationResearcherSkillsSection = (): string => {
  return `${SPECIALIZATION_RESEARCHER_SKILLS_SECTION_HEADING}

The "## Available Skills" table (when present) is the complete catalog for this specialization. Each row lists name, description, input, and output.

## Skill selection policy
Before reporting a gap, evaluate every catalog skill:
1. Score fit 0–100% using description, input, and output vs the goal (intent 40%, input coverage 30%, output coverage 30%).
2. If any skill is >= 70% fit: list it under Suggested skills with fit % and what to refine at runtime.
3. If 2+ skills combine to >= 70% fit: list all names under Suggested skills for composition.
4. Only report Gaps requiring new skills when no single skill or composition reaches 70%.
5. Never invent skill names — copy catalog names exactly (case, hyphens, spelling).

Rules:
1. Never invent, guess, or paraphrase skill names.
2. If "## Available Skills" is missing or empty, set Suggested skills: none and describe executable work under Gaps requiring new skills.
3. Prefer reusing or composing existing skills over reporting gaps.
4. Use assigned MCP tools when they can answer the research goal more precisely than web search alone.`;
};
