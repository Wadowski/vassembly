export interface NotificationCategoryDefinition {
  id: string;
  label: string;
  rolesAllowed: readonly string[];
}

export const NOTIFICATION_CATEGORIES: readonly NotificationCategoryDefinition[] = [
  {
    id: 'operational',
    label: 'Operational alerts',
    rolesAllowed: ['admin'],
  },
  {
    id: 'safety',
    label: 'Safety & critical alerts',
    rolesAllowed: ['admin'],
  },
] as const;

export const getVisibleCategories = ({ userRole }: { userRole: string }) => {
  const normalized = userRole.trim().toLowerCase();
  return NOTIFICATION_CATEGORIES.filter((category) =>
    category.rolesAllowed.some((role) => role.toLowerCase() === normalized),
  );
};
