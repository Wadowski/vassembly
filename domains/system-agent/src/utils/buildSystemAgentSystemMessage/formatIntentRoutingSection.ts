import { INTENT_CATEGORIES } from '@vassembly/constants';

export const formatIntentRoutingSection = (): string => {
  const routes = INTENT_CATEGORIES.map(
    (category) => `- ${category.slug} → "${category.targetSystemAgentName}"`,
  ).join('\n');

  return `## Routing\n${routes}`;
};
