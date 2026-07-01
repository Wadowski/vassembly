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
    'After create_skill succeeds, end your response with a single JSON line:',
    '{"skillId":"<id>","isNew":true|false}',
  );

  return sections.join('\n');
};
