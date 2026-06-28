import { appendCurrentDateTimeSection, SYSTEM_AGENT_NAME } from '@vassembly/constants';

import { formatIntentCategoriesSection } from './formatIntentCategoriesSection';
import { formatIntentRoutingSection } from './formatIntentRoutingSection';

export interface BuildSystemAgentSystemMessageParams {
  name: string;
  rule: string;
  skillsCatalogSection?: string;
  now?: Date;
}

export const buildSystemAgentSystemMessage = ({
  name,
  rule,
  skillsCatalogSection,
  now,
}: BuildSystemAgentSystemMessageParams): string => {
  let systemMessage = rule;

  if (name === SYSTEM_AGENT_NAME.IntentClassifier) {
    systemMessage = `${rule}\n\n${formatIntentCategoriesSection()}`;
  } else if (name === SYSTEM_AGENT_NAME.Assistant) {
    systemMessage = `${rule}\n\n${formatIntentRoutingSection()}`;
  }

  if (skillsCatalogSection) {
    systemMessage = `${systemMessage}\n\n${skillsCatalogSection}`;
  }

  return appendCurrentDateTimeSection({ systemMessage, now });
};
