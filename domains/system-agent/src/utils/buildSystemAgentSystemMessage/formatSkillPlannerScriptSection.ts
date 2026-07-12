import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

export const SKILL_PLANNER_SCRIPT_SECTION_HEADING = '## Skill script policy';

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
