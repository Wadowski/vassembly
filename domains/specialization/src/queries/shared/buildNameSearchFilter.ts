import { escapeRegex } from './escapeRegex';

export interface BuildNameSearchFilterParams {
  search?: string;
}

export const buildNameSearchFilter = ({
  search,
}: BuildNameSearchFilterParams): Record<string, unknown> | undefined => {
  if (search === undefined || search.trim() === '') {
    return undefined;
  }

  const term = escapeRegex(search.trim());

  return {
    name: { $regex: term, $options: 'i' },
  };
};
