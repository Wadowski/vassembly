export interface FormatSkillsCatalogSectionParams {
  items: Array<{ name: string; description: string }>;
}

export const formatSkillsCatalogSection = ({
  items,
}: FormatSkillsCatalogSectionParams): string => {
  if (items.length === 0) {
    return '';
  }

  const lines = items.map((item) => `- **${item.name}**: ${item.description}`);
  return `## Available Skills\n\n${lines.join('\n')}`;
};
