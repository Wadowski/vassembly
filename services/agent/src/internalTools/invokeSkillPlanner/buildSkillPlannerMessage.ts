import type { BuildSkillPlannerMessageParams } from './types';

export const buildSkillPlannerMessage = ({
  specializationName,
  specializationId,
  goal,
  mcpItems,
  skillsCatalogSection,
}: BuildSkillPlannerMessageParams): string => {
  const mcpLines =
    mcpItems.length === 0
      ? 'No MCPs linked to this specialization.'
      : mcpItems.map((mcp) => `- ${mcp.slug} (${mcp.name}): ${mcp.description}`).join('\n');

  const sections = [
    `Specialization: ${specializationName} (${specializationId})`,
    '',
    'Goal for the new skill:',
    goal,
    '',
    'Available MCPs (reference only these in the skill rule):',
    mcpLines,
  ];

  if (skillsCatalogSection !== undefined && skillsCatalogSection.trim() !== '') {
    sections.push('', skillsCatalogSection);
  }

  sections.push(
    '',
    'Script policy:',
    '- Never embed shell commands or code in the skill rule.',
    '- Create scripts/ files via Skill script creators for any terminal, bash, Python, or Node.js logic.',
    '- Reference scripts in the rule with run_skill_script scripts/<filename>.',
    '',
    'After create_skill succeeds, end your response with a single JSON line:',
    '{"skillId":"<id>","isNew":true|false}',
  );

  return sections.join('\n');
};
