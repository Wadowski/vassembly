import { AGENT_LIST_ALL_STATUSES, AgentCategory, AgentStatus } from '@vassembly/ui-api-hooks';
import type { TagVariant } from '@vassembly/ui-system-design/tag';

import { AGENT_LIST_STATUS_OPTIONS } from './types';

const AGENT_STATUS_TAG_VARIANT: Record<AgentStatus, TagVariant> = {
  [AgentStatus.Active]: 'success',
  [AgentStatus.Archived]: 'default',
  [AgentStatus.Disabled]: 'warning',
};

const AGENT_CATEGORY_TAG_VARIANT: Record<AgentCategory, TagVariant> = {
  [AgentCategory.Coding]: 'default',
  [AgentCategory.Personal]: 'default',
  [AgentCategory.Utility]: 'default',
};

const AGENT_CATEGORY_LABEL: Record<AgentCategory, string> = {
  [AgentCategory.Coding]: 'Coding',
  [AgentCategory.Personal]: 'Personal',
  [AgentCategory.Utility]: 'Utility',
};

const statusLabelByValue = new Map(
  AGENT_LIST_STATUS_OPTIONS.filter(
    (option): option is { value: AgentStatus; label: string } =>
      option.value !== AGENT_LIST_ALL_STATUSES,
  ).map((option) => [option.value, option.label]),
);

export const getAgentStatusTagVariant = (status: AgentStatus): TagVariant =>
  AGENT_STATUS_TAG_VARIANT[status];

export const getAgentStatusLabel = (status: AgentStatus): string =>
  statusLabelByValue.get(status) ?? status;

export const getAgentCategoryTagVariant = (category: AgentCategory): TagVariant =>
  AGENT_CATEGORY_TAG_VARIANT[category];

export const getAgentCategoryLabel = (category: AgentCategory): string =>
  AGENT_CATEGORY_LABEL[category];
