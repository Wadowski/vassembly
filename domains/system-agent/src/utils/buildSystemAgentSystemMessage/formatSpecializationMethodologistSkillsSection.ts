export const SPECIALIZATION_METHODOLOGIST_SKILLS_SECTION_HEADING = '## Skill and tool catalog policy';

export const isSpecializationMethodologistAgentName = ({ name }: { name: string }): boolean => {
  const normalizedName = name.trim().toLowerCase();

  return normalizedName.endsWith(' methodologist');
};

export const formatSpecializationMethodologistSkillsSection = (): string => {
  return `${SPECIALIZATION_METHODOLOGIST_SKILLS_SECTION_HEADING}

The "## Available Skills" table (when present) is the complete skill catalog for this specialization. Assigned MCP tools and internal tools (web_search, web_page_content, skill-resolve, skill-run-script, skill-plan) are what researcher, worker, and validator agents in this specialization can use.

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
4. Reference assigned MCP tools when they enable steps that web search alone cannot cover.`;
};
