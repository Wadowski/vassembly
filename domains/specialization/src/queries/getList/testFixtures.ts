import type { SpecializationModel } from '../../model';

export interface SpecializationSeedEntry {
  name: string;
  description: string;
}

export const SEED_SPECIALIZATIONS: SpecializationSeedEntry[] = [
  {
    name: 'email automation',
    description: 'Tasks involving email workflows, inbox management, and messaging',
  },
  {
    name: 'web research',
    description: 'Tasks that require searching and synthesizing information from the web',
  },
  {
    name: 'data analysis',
    description: 'Tasks focused on spreadsheets, metrics, and quantitative insights',
  },
];

const BASE_DATE = new Date('2026-01-15T10:00:00.000Z');

export const SEED_SPECIALIZATION_DOCS: Array<Partial<SpecializationModel> & { _id: string }> =
  SEED_SPECIALIZATIONS.map((entry, index) => ({
    _id: `507f1f77bcf86cd7994390${String(index + 10).padStart(2, '0')}`,
    name: entry.name,
    description: entry.description,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
  }));

export const buildPaginationDataset = (
  count: number,
): Array<Partial<SpecializationModel> & { _id: string }> =>
  Array.from({ length: count }, (_, index) => ({
    _id: `507f1f77bcf86cd79943a${String(index).padStart(3, '0')}`,
    name: `catalog specialization ${String(index).padStart(3, '0')}`,
    description: `Description for catalog specialization ${index}`,
    createdAt: BASE_DATE,
    updatedAt: BASE_DATE,
  }));

const matchesRegex = (value: string, pattern: RegExp): boolean => pattern.test(value);

const matchesFilter = (
  doc: Partial<SpecializationModel> & { _id: string },
  filter: Record<string, unknown>,
): boolean => {
  if (Object.keys(filter).length === 0) {
    return true;
  }

  const nameFilter = filter.name as { $regex?: string; $options?: string } | undefined;

  if (nameFilter?.$regex !== undefined) {
    const flags = nameFilter.$options?.includes('i') ? 'i' : '';
    const pattern = new RegExp(nameFilter.$regex, flags);

    return matchesRegex(doc.name ?? '', pattern);
  }

  return true;
};

const sortByName = (
  left: Partial<SpecializationModel> & { _id: string },
  right: Partial<SpecializationModel> & { _id: string },
): number => (left.name ?? '').localeCompare(right.name ?? '');

export const createInMemorySpecializationStore = (
  docs: Array<Partial<SpecializationModel> & { _id: string }> = SEED_SPECIALIZATION_DOCS,
) => {
  const getManyRaw = async (
    filter: Record<string, unknown>,
    options?: { sort?: Record<string, number>; offset?: number; limit?: number },
  ) => {
    const filtered = docs.filter((doc) => matchesFilter(doc, filter)).sort(sortByName);
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? filtered.length;

    return filtered.slice(offset, offset + limit).map((doc) => ({
      ...doc,
      id: doc._id,
    }));
  };

  const countDocuments = async (filter: Record<string, unknown>) =>
    docs.filter((doc) => matchesFilter(doc, filter)).length;

  return {
    getManyRaw,
    countDocuments,
  };
};
