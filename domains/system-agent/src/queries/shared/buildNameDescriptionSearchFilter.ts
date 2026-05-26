import { escapeRegex } from './escapeRegex';

export interface BuildNameDescriptionSearchFilterParams {
  search?: string;
}

export const buildNameDescriptionSearchFilter = ({
  search,
}: BuildNameDescriptionSearchFilterParams): Record<string, unknown> | undefined => {
  if (search === undefined || search.trim() === '') {
    return undefined;
  }

  const term = escapeRegex(search.trim());

  return {
    $or: [
      { name: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
    ],
  };
};
