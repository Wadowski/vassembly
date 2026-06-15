import { getIntentCategorySlugs, INTENT_CATEGORIES } from '@vassembly/constants';

export const formatIntentCategoriesSection = (): string => {
  const slugList = getIntentCategorySlugs().join(' | ');
  const categoryBlocks = INTENT_CATEGORIES.map((category) => {
    const examples = category.examples.map((example) => `"${example}"`).join(', ');
    return `### ${category.slug}\n${category.description}\n\nExamples: ${examples}`;
  }).join('\n\n');

  return `Valid slugs: ${slugList}\n\n## Categories\n\n${categoryBlocks}`;
};
