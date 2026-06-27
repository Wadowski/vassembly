const MAX_SPECIALIZATION_RESULTS = 3;

const NEW_PREFIX = 'NEW:';

export type NormalizeGeneratedSpecializationsResult =
  | { isValid: true; type: 'existing'; specializationIds: string[] }
  | { isValid: true; type: 'new'; name: string; description: string }
  | { isValid: false; reason: 'empty_output' | 'invalid_output' | 'too_many_results' };

export interface NormalizeGeneratedSpecializationsParams {
  rawOutput: string;
  existingByLowerName: Map<string, string>;
}

const parseNewLine = ({
  line,
}: {
  line: string;
}): { name: string; description: string } | null => {
  const payload = line.slice(NEW_PREFIX.length).trim();

  if (!payload.includes('|')) {
    return null;
  }

  const separatorIndex = payload.indexOf('|');
  const name = payload.slice(0, separatorIndex).trim().toLowerCase();
  const description = payload.slice(separatorIndex + 1).trim();

  if (!name || !description) {
    return null;
  }

  return { name, description };
};

export const normalizeGeneratedSpecializations = ({
  rawOutput,
  existingByLowerName,
}: NormalizeGeneratedSpecializationsParams): NormalizeGeneratedSpecializationsResult => {
  const lines = rawOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { isValid: false, reason: 'empty_output' };
  }

  if (lines.length > MAX_SPECIALIZATION_RESULTS) {
    return { isValid: false, reason: 'too_many_results' };
  }

  const newLine = lines.find((line) => line.toUpperCase().startsWith(NEW_PREFIX));

  if (newLine !== undefined) {
    const parsed = parseNewLine({ line: newLine });

    if (parsed === null) {
      return { isValid: false, reason: 'invalid_output' };
    }

    return {
      isValid: true,
      type: 'new',
      name: parsed.name,
      description: parsed.description,
    };
  }

  const specializationIds: string[] = [];

  for (const line of lines) {
    const specializationId = existingByLowerName.get(line.toLowerCase());

    if (specializationId !== undefined && !specializationIds.includes(specializationId)) {
      specializationIds.push(specializationId);
    }
  }

  if (specializationIds.length === 0) {
    return { isValid: false, reason: 'invalid_output' };
  }

  return {
    isValid: true,
    type: 'existing',
    specializationIds,
  };
};
