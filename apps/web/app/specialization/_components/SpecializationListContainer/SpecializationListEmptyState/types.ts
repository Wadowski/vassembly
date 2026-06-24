export type SpecializationListEmptyStateVariant = 'no-specializations' | 'no-results';

export interface SpecializationListEmptyStateProps {
  variant: SpecializationListEmptyStateVariant;
  searchQuery?: string;
}
