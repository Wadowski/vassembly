export interface SkillCatalogFormatItem {
  name: string;
  description: string;
  input: string;
  output: string;
}

export interface FormatSkillsCatalogSectionParams {
  items: SkillCatalogFormatItem[];
}

const formatCatalogRow = ({ item }: { item: SkillCatalogFormatItem }): string => {
  const input = item.input.trim() !== '' ? item.input : '—';
  const output = item.output.trim() !== '' ? item.output : '—';

  return `| ${item.name} | ${item.description} | ${input} | ${output} |`;
};

export const formatSkillsCatalogSection = ({
  items,
}: FormatSkillsCatalogSectionParams): string => {
  if (items.length === 0) {
    return '';
  }

  const header = '| Name | Description | Input | Output |';
  const separator = '| --- | --- | --- | --- |';
  const rows = items.map((item) => formatCatalogRow({ item }));

  return `## Available Skills\n\n${[header, separator, ...rows].join('\n')}`;
};
