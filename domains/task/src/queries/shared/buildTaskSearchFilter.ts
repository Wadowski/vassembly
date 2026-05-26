export interface BuildTaskSearchFilterParams {
  search?: string;
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildTaskSearchFilter = ({
  search,
}: BuildTaskSearchFilterParams): Record<string, unknown> | undefined => {
  if (search === undefined || search.trim() === '') {
    return undefined;
  }

  const term = escapeRegex(search.trim());

  return {
    $or: [
      { description: { $regex: term, $options: 'i' } },
      { title: { $regex: term, $options: 'i' } },
    ],
  };
};
