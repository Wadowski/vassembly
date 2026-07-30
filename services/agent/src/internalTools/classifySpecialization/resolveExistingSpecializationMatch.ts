export interface CatalogSpecializationEntry {
  id: string;
  name: string;
}

export interface ResolveExistingSpecializationMatchParams {
  candidate: string;
  catalogItems: CatalogSpecializationEntry[];
}

const MIN_FUZZY_MATCH_LENGTH = 3;

const tokenizeName = ({ name }: { name: string }): string[] =>
  name
    .toLowerCase()
    .split(/[\s&/,+-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

export const resolveExistingSpecializationMatch = ({
  candidate,
  catalogItems,
}: ResolveExistingSpecializationMatchParams): string | undefined => {
  const normalizedCandidate = candidate.trim().toLowerCase();

  if (!normalizedCandidate) {
    return undefined;
  }

  const exactMatch = catalogItems.find(
    (item) => item.name.toLowerCase() === normalizedCandidate,
  );

  if (exactMatch) {
    return exactMatch.id;
  }

  if (normalizedCandidate.length < MIN_FUZZY_MATCH_LENGTH) {
    return undefined;
  }

  const fuzzyMatches = catalogItems.filter((item) => {
    const nameLower = item.name.toLowerCase();

    if (nameLower.startsWith(normalizedCandidate) || normalizedCandidate.startsWith(nameLower)) {
      return true;
    }

    return tokenizeName({ name: item.name }).includes(normalizedCandidate);
  });

  if (fuzzyMatches.length === 0) {
    return undefined;
  }

  const prefixMatch = fuzzyMatches.find((item) =>
    item.name.toLowerCase().startsWith(normalizedCandidate),
  );

  if (prefixMatch) {
    return prefixMatch.id;
  }

  return fuzzyMatches.sort((left, right) => left.name.length - right.name.length)[0]?.id;
};
