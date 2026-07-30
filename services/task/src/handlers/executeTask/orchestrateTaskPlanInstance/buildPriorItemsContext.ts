export interface PriorItemContextEntry {
  templateItemIndex: number;
  description: string;
  output: Record<string, unknown> | null;
}

export const buildPriorItemsContext = ({
  priorItems,
}: {
  priorItems: PriorItemContextEntry[];
}): string => {
  if (priorItems.length === 0) {
    return 'none';
  }

  return priorItems
    .map(
      (item) =>
        `Item ${item.templateItemIndex + 1} — Goal: ${item.description}\nOutput: ${JSON.stringify(item.output ?? {})}`,
    )
    .join('\n\n');
};
