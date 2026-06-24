import type { UseLinkedSpecializationsResult } from '@vassembly/ui-api-hooks';

export interface LinkedSpecializationsProps {
  specializationIds: string[];
  isAdmin: boolean;
}

export interface LinkedSpecializationsViewProps extends LinkedSpecializationsProps {
  linked: UseLinkedSpecializationsResult;
}
