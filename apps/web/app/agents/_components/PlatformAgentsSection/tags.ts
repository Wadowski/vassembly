import {
  SystemAgentCategory,
  SystemAgentStatus,
} from '@vassembly/ui-api-hooks';
import type { TagVariant } from '@vassembly/ui-tag';

const CATEGORY_LABEL: Record<SystemAgentCategory, string> = {
  [SystemAgentCategory.Coding]: 'Coding',
  [SystemAgentCategory.Utility]: 'Utility',
  [SystemAgentCategory.Onboarding]: 'Onboarding',
  [SystemAgentCategory.Compliance]: 'Compliance',
};

const STATUS_LABEL: Record<SystemAgentStatus, string> = {
  [SystemAgentStatus.Active]: 'Active',
  [SystemAgentStatus.Archived]: 'Archived',
  [SystemAgentStatus.Disabled]: 'Disabled',
};

const STATUS_VARIANT: Record<SystemAgentStatus, TagVariant> = {
  [SystemAgentStatus.Active]: 'success',
  [SystemAgentStatus.Archived]: 'warning',
  [SystemAgentStatus.Disabled]: 'default',
};

export const getSystemAgentCategoryLabel = (category?: SystemAgentCategory): string => {
  if (category === undefined) {
    return 'Uncategorized';
  }
  return CATEGORY_LABEL[category] ?? category;
};

export const getSystemAgentStatusLabel = (status: SystemAgentStatus): string =>
  STATUS_LABEL[status] ?? status;

export const getSystemAgentStatusVariant = (status: SystemAgentStatus): TagVariant =>
  STATUS_VARIANT[status] ?? 'default';
