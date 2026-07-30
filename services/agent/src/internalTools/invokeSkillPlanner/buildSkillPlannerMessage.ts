import type { BuildSkillPlannerMessageParams } from './types';

export const buildSkillPlannerMessage = ({
  specializationName,
  specializationId,
  goal,
  mcpItems,
  skillsCatalogSection,
  similarSkillsSection,
}: BuildSkillPlannerMessageParams): string => {
  const mcpLines =
    mcpItems.length === 0
      ? 'No MCPs linked to this specialization.'
      : mcpItems.map((mcp) => `- ${mcp.slug} (${mcp.name}): ${mcp.description}`).join('\n');

  const sections = [
    `Specialization: ${specializationName} (${specializationId})`,
    '',
    'Goal:',
    goal,
    '',
    'Available MCPs (reference only these in the skill rule):',
    mcpLines,
  ];

  if (skillsCatalogSection !== undefined && skillsCatalogSection.trim() !== '') {
    sections.push('', skillsCatalogSection);
  }

  if (similarSkillsSection !== undefined && similarSkillsSection.trim() !== '') {
    sections.push('', similarSkillsSection);
  }

  sections.push(
    '',
    'Script policy:',
    '- Never embed shell commands or code in the skill rule.',
    '- Create scripts/ files via Skill script creators for any terminal, bash, Python, or Node.js logic.',
    '- Reference scripts in the rule with run_skill_script scripts/<filename>.',
    '',
    'End your response with exactly one JSON line:',
    '- Reuse existing skill (fit >= 70%): {"action":"reuse","skillName":"<name>","fitScore":0.85,"refinements":"<optional>"}',
    '- Compose existing skills (combined fit >= 70%): {"action":"compose","skillNames":["<name>","<name>"],"fitScore":0.75}',
    '- Create new skill: call create_skill, then {"skillId":"<id>","isNew":true|false}',
  );

  return sections.join('\n');
};
