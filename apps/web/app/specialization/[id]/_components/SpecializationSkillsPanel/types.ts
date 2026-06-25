import type { SkillListItem } from '@vassembly/ui-api-hooks';

export interface SpecializationSkillsPanelProps {
  specializationId: string;
}

export interface SpecializationSkillListItemProps {
  skill: SkillListItem;
  specializationId: string;
}
