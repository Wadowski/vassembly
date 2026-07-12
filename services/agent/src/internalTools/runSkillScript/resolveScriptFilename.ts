export interface ResolveScriptFilenameParams {
  scriptRef: string;
  scripts: Array<{ filename: string }>;
}

const normalizeScriptToken = ({ value }: { value: string }): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^scripts\//, '')
    .replace(/_/g, '-');

const getBasename = ({ filename }: { filename: string }): string =>
  filename.split('/').pop()?.toLowerCase() ?? '';

const getStem = ({ basename }: { basename: string }): string => basename.replace(/\.[^.]+$/, '');

export const resolveScriptFilename = ({
  scriptRef,
  scripts,
}: ResolveScriptFilenameParams): string | null => {
  const trimmedRef = scriptRef.trim();

  if (!trimmedRef) {
    return null;
  }

  const exactMatch = scripts.find((script) => script.filename === trimmedRef);

  if (exactMatch) {
    return exactMatch.filename;
  }

  const normalizedRef = normalizeScriptToken({ value: trimmedRef });
  const normalizedRefStem = getStem({ basename: normalizedRef });

  const fuzzyMatches = scripts.filter((script) => {
    const normalizedScriptPath = normalizeScriptToken({ value: script.filename });
    const basename = getBasename({ filename: script.filename }).replace(/_/g, '-');
    const stem = getStem({ basename });

    return (
      normalizedScriptPath === normalizedRef ||
      basename === normalizedRef ||
      stem === normalizedRef ||
      stem === normalizedRefStem ||
      basename === normalizedRefStem
    );
  });

  if (fuzzyMatches.length === 1) {
    return fuzzyMatches[0]!.filename;
  }

  return null;
};
