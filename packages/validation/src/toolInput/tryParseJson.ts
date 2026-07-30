export const tryParseJson = ({ raw }: { raw: string }): unknown | null => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};
