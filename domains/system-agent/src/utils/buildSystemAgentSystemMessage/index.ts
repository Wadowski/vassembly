import { SYSTEM_AGENT_NAME } from '@vassembly/constants';

import { formatIntentCategoriesSection } from './formatIntentCategoriesSection';
import { formatIntentRoutingSection } from './formatIntentRoutingSection';

export interface BuildSystemAgentSystemMessageParams {
  name: string;
  rule: string;
}

export const buildSystemAgentSystemMessage = ({
  name,
  rule,
}: BuildSystemAgentSystemMessageParams): string => {
  if (name === SYSTEM_AGENT_NAME.IntentClassifier) {
    return `${rule}\n\n${formatIntentCategoriesSection()}`;
  }

  if (name === SYSTEM_AGENT_NAME.Assistant) {
    return `${rule}\n\n${formatIntentRoutingSection()}`;
  }

  return rule;
};
