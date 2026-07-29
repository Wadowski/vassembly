import type { SkillCatalogItem } from '@vassembly/domain-skill';

export interface FindSimilarSkillsParams {
  items: SkillCatalogItem[];
  query: string;
  threshold?: number;
}

const tokenize = ({ text }: { text: string }): string[] =>
  text
    .toLowerCase()
    .split(/[\s,_-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2);

const computeOverlapScore = ({
  queryTokens,
  itemTokens,
}: {
  queryTokens: Set<string>;
  itemTokens: string[];
}): number => {
  if (queryTokens.size === 0) {
    return 0;
  }

  const overlap = itemTokens.filter((token) => queryTokens.has(token)).length;

  return overlap / queryTokens.size;
};

export const findSimilarSkills = ({
  items,
  query,
  threshold = 0.4,
}: FindSimilarSkillsParams): SkillCatalogItem[] => {
  const queryTokens = new Set(tokenize({ text: query }));

  return items.filter((item) => {
    const itemTokens = tokenize({
      text: `${item.name} ${item.description} ${item.input} ${item.output}`,
    });

    return computeOverlapScore({ queryTokens, itemTokens }) >= threshold;
  });
};
