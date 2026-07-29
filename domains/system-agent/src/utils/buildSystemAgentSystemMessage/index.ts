import { appendCurrentDateTimeSection, SYSTEM_AGENT_NAME } from '@vassembly/constants';

import { formatAssistantOrchestrationSection } from './formatAssistantOrchestrationSection';
import { formatIntentCategoriesSection } from './formatIntentCategoriesSection';
import { formatIntentRoutingSection } from './formatIntentRoutingSection';
import { formatSkillPlannerReuseSection, formatSkillPlannerScriptSection } from './formatSkillPlannerScriptSection';
import {
  formatSpecializationResearcherSkillsSection,
  isSpecializationResearcherAgentName,
} from './formatSpecializationResearcherSkillsSection';
import {
  formatSpecializationWorkerExecutionSection,
  isSpecializationWorkerAgentName,
} from './formatSpecializationWorkerExecutionSection';
import { formatSubagentOutputPolicySection } from './formatSubagentOutputPolicySection';
import { formatTaskPlannerPlanningSection } from './formatTaskPlannerPlanningSection';
import { formatTaskWorkerOrchestrationSection } from './formatTaskWorkerOrchestrationSection';

export interface BuildSystemAgentSystemMessageParams {
  name: string;
  rule: string;
  skillsCatalogSection?: string;
  agentsCatalogSection?: string;
  customInstructions?: string;
  now?: Date;
}

export const buildSystemAgentSystemMessage = ({
  name,
  rule,
  skillsCatalogSection,
  agentsCatalogSection,
  customInstructions,
  now,
}: BuildSystemAgentSystemMessageParams): string => {
  const sections: string[] = [rule];

  if (name !== SYSTEM_AGENT_NAME.Assistant) {
    sections.push(formatSubagentOutputPolicySection());
  }

  if (name === SYSTEM_AGENT_NAME.IntentClassifier) {
    sections.push(formatIntentCategoriesSection());
  } else if (name === SYSTEM_AGENT_NAME.Assistant) {
    sections.push(formatIntentRoutingSection());
    sections.push(formatAssistantOrchestrationSection());
  } else if (name === SYSTEM_AGENT_NAME.TaskWorker) {
    sections.push(formatTaskWorkerOrchestrationSection());
  } else if (name === SYSTEM_AGENT_NAME.TaskPlanner) {
    sections.push(formatTaskPlannerPlanningSection());
  } else if (name === SYSTEM_AGENT_NAME.SkillPlanner) {
    sections.push(formatSkillPlannerReuseSection());
    sections.push(formatSkillPlannerScriptSection());
  } else if (isSpecializationResearcherAgentName({ name })) {
    sections.push(formatSpecializationResearcherSkillsSection());
  } else if (isSpecializationWorkerAgentName({ name })) {
    sections.push(formatSpecializationWorkerExecutionSection());
  }

  let systemMessage = sections.join('\n\n');

  if (customInstructions) {
    systemMessage = `${systemMessage}\n\n## Specialization-specific guidance\n\n${customInstructions}`;
  }

  if (skillsCatalogSection) {
    systemMessage = `${systemMessage}\n\n${skillsCatalogSection}`;
  }

  if (agentsCatalogSection) {
    systemMessage = `${systemMessage}\n\n${agentsCatalogSection}`;
  }

  return appendCurrentDateTimeSection({ systemMessage, now });
};
