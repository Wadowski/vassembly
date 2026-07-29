import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

export const SKILL_PLANNER_SCRIPT_SECTION_HEADING = '## Skill script policy';
export const SKILL_PLANNER_REUSE_SECTION_HEADING = '## Skill reuse policy';

export const formatSkillPlannerReuseSection = (): string => {
  return `${SKILL_PLANNER_REUSE_SECTION_HEADING}

Before creating a skill, review "## Available Skills" (name, description, input, output):
1. If any skill is >= 70% fit for the goal, STOP and end with: {"action":"reuse","skillName":"<name>","fitScore":0.85,"refinements":"<what to refine at runtime>"}
2. If 2+ skills combine to >= 70% fit, STOP and end with: {"action":"compose","skillNames":["<name>","<name>"],"fitScore":0.75}
3. Run dedup: do not create skills >80% similar in name or description to existing catalog entries.
4. Create only when no reuse or composition reaches 70%.

When creating (only if steps 1–2 do not apply):
- Name: generic capability (verb-noun), not task-specific.
- Description: when to use (<=200 chars).
- Input / Output: explicit contract (required for create_skill).
- Rule: one capability, <=15 numbered steps; delegate details to child skills via use skill.
- usesSkillIds: set when composing existing skills.
- Scripts: only for logic not covered by an existing script skill.`;
};

export const formatSkillPlannerScriptSection = (): string => {
  const pythonCreator = SYSTEM_AGENT_NAME.SkillScriptCreatorPython;
  const javascriptCreator = SYSTEM_AGENT_NAME.SkillScriptCreatorJavascript;
  const bashCreator = SYSTEM_AGENT_NAME.SkillScriptCreatorBash;

  return `${SKILL_PLANNER_SCRIPT_SECTION_HEADING}

Never embed executable code or shell commands in the skill rule. Code blocks, backtick-wrapped commands, and inline CLI snippets are forbidden.

When the skill needs terminal commands, shell automation, or any executable logic:
1. Call use_agent on the matching script creator: "${pythonCreator}", "${javascriptCreator}", or "${bashCreator}".
2. Persist returned source in create_skill scripts[] (filename: scripts/<name>.<ext>).
3. Reference each script in the rule with: run_skill_script scripts/<filename>

The rule contains procedural steps only. Scripts execute via run_skill_script.`;
};
